// CREDITS TO lukeed https://github.com/lukeed/tsm

import { promises } from 'fs';
import { dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL, URL } from 'url';
import type { Config, Extension, Options } from './config';
import { defaults, fileExists, finalize, nodeMajor, nodeMinor } from './utils';

if (!process.env.KEEP_LOADER_ARGV) {
  const loaderArgIndex = process.execArgv.findIndex(v => v.startsWith('--loader'));

  if (loaderArgIndex !== -1) process.execArgv.splice(loaderArgIndex, 1);
}

export const tsconfigPathsHandler = process.env.TSCONFIG_PATHS
  ? import('./deps/typescriptPaths.js').then(({ createHandler }) => createHandler())
  : undefined;

const HAS_UPDATED_HOOKS = nodeMajor > 16 || (nodeMajor === 16 && nodeMinor >= 12);

let config: Config;
let esbuild: typeof import('esbuild');

const env = defaults('esm');
const setup = env.file && import('file:///' + env.file);

type Promisable<T> = Promise<T> | T;
type Source = string | SharedArrayBuffer | Uint8Array;
type Format = 'builtin' | 'commonjs' | 'json' | 'module' | 'wasm';

type Resolve = (
  specifier: string,
  context: {
    conditions: string[];
    parentURL?: string;
  },
  fallback: Resolve
) => Promisable<{ url: string; format?: Format | null; shortCircuit: boolean }>;

type Inspect = (url: string, context: object, fallback: Inspect) => Promisable<{ format: Format }>;

type Transform = (
  source: Source,
  context: Record<'url' | 'format', string>,
  fallback: Transform
) => Promisable<{ source: Source }>;

type Load = (
  url: string,
  context: { format: Format | null | undefined },
  defaultLoad: Load
) => Promise<{ format: Format; source: Source; shortCircuit: boolean }>;

async function getConfig(): Promise<Config> {
  let mod = await setup;
  mod = (mod && mod.default) || mod;
  return finalize(env, mod);
}

const EXTN = /\.\w+(?=\?|$)/;
const isTS = /\.[mc]?tsx?(?=\?|$)/;
const isJS = /\.([mc])?js$/;
async function toOptions(uri: string): Promise<Options | void> {
  config = config || (await getConfig());
  let [extn] = EXTN.exec(uri) || [];
  return config[extn as `.${string}`];
}

async function check(fileurl: string): Promise<string | void> {
  if (await fileExists(fileURLToPath(fileurl))) return fileurl;
}

const root = new URL('file:///' + process.cwd() + '/');
const rootPath = fileURLToPath(root);

let scriptExtensions: `.${string}`[];

export const resolve: Resolve = async function (specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (err: any) {
    if ('code' in err && err.code === 'ERR_MODULE_NOT_FOUND') {
      if (tsconfigPathsHandler) {
        try {
          const handlerTsconfigPaths = await tsconfigPathsHandler;

          const tsResolvedUrl = handlerTsconfigPaths?.(
            specifier,
            context.parentURL ? fileURLToPath(context.parentURL) : rootPath
          );

          if (tsResolvedUrl) {
            return {
              url: pathToFileURL(tsResolvedUrl).href,
              shortCircuit: true,
            };
          }
        } catch (err) {}
      }

      if (extname(specifier) === '') {
        config ||= await getConfig();

        scriptExtensions ||= (Object.keys(config) as Array<typeof ext>).filter(v => v !== '.json');

        for (const ext of scriptExtensions) {
          try {
            return await defaultResolve(specifier + ext, context, defaultResolve);
          } catch (err) {}
        }
      }
    }
  }

  // ignore "prefix:", non-relative identifiers, and respect import maps
  if (/^\w+\:?/.test(specifier)) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  let match: RegExpExecArray | null;
  let idx: number, ext: Extension, path: string | void;
  let output = new URL(specifier, context.parentURL || root);

  // source ident includes extension
  if ((match = EXTN.exec(output.href))) {
    ext = match[0] as Extension;
    if (!context.parentURL || isTS.test(ext)) {
      return { url: output.href, shortCircuit: true };
    }
    // source ident exists
    path = await check(output.href);
    if (path) return { url: path, shortCircuit: true };
    // parent importer is a ts file
    // source ident is js & NOT exists
    if (isJS.test(ext) && isTS.test(context.parentURL)) {
      // reconstruct ".js" -> ".ts" source file
      path = output.href.substring(0, (idx = match.index));
      if ((path = await check(path + ext.replace('js', 'ts')))) {
        idx += ext.length;
        if (idx > output.href.length) {
          path += output.href.substring(idx);
        }
        return { url: path, shortCircuit: true };
      }
      // return original, let it error
      return defaultResolve(specifier, context, defaultResolve);
    }
  }

  config ||= await getConfig();

  scriptExtensions ||= (Object.keys(config) as Array<typeof ext>).filter(v => v !== '.json');

  for (ext of scriptExtensions) {
    path = await check(output.href + ext);
    if (path) return { url: path, shortCircuit: true };
  }

  // Check if + "/index.{ts,tsx,mts,cts}" exists
  const trailingOutputHref = output.href.endsWith('/') ? output.href : output.href + '/';
  for (ext of scriptExtensions) {
    path = await check(trailingOutputHref + 'index' + ext);
    if (path) return { url: path, shortCircuit: true };
  }

  return defaultResolve(specifier, context, defaultResolve);
};

export const getFormat: Inspect | undefined = HAS_UPDATED_HOOKS
  ? undefined
  : async function (uri, context, fallback) {
      let options = await toOptions(uri);
      if (options == null) return fallback(uri, context, fallback);

      if (uri.endsWith('.d.ts')) return { format: 'module' };

      return { format: options.format === 'cjs' ? 'commonjs' : 'module' };
    };

function getDirnames(url: string) {
  const filename = fileURLToPath(url);

  return { __dirname: JSON.stringify(dirname(filename)), __filename: JSON.stringify(filename) };
}

export const load: Load = async function (url, context, defaultLoad) {
  let options = await toOptions(url);

  if (options == null) return defaultLoad(url, context, defaultLoad);

  if (url.endsWith('.d.ts')) return { format: 'module', source: '', shortCircuit: true };

  const format = options.format === 'cjs' ? 'commonjs' : 'module';

  const rawSource = await promises.readFile(new URL(url));

  esbuild = esbuild || (await import('esbuild'));

  const isModule = format === 'module';

  const { code: source } = await esbuild.transform(rawSource.toString(), {
    ...options,
    define: isModule ? { ...getDirnames(url), ...options.define } : options.define,
    sourcefile: url,
    format: isModule ? 'esm' : 'cjs',
  });

  return {
    format,
    source,
    shortCircuit: true,
  };
};

export const transformSource: Transform | undefined = HAS_UPDATED_HOOKS
  ? undefined
  : async function (source, context, xform) {
      let options = await toOptions(context.url);
      if (options == null) return xform(source, context, xform);

      if (context.url.endsWith('.d.ts')) return { source: '' };

      const isModule = context.format === 'module';

      // TODO: decode SAB/U8 correctly
      esbuild = esbuild || (await import('esbuild'));
      let result = await esbuild.transform(source.toString(), {
        ...options,
        define: isModule ? { ...getDirnames(context.url), ...options.define } : options.define,
        sourcefile: context.url,
        format: isModule ? 'esm' : 'cjs',
      });

      return { source: result.code };
    };
