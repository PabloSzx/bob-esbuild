// CREDITS TO lukeed https://github.com/lukeed/tsm

import { existsSync, promises } from 'fs';
import semverGte from 'semver/functions/gte.js';
import { fileURLToPath, URL } from 'url';
import type { Config, Extension, Options } from '../config';
import { defaults, finalize } from './utils';

const HAS_UPDATED_HOOKS = semverGte(process.versions.node, '16.12.0');

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
) => Promisable<{ url: string; format?: Format | null }>;

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
) => Promise<{ format: Format; source: Source }>;

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

function check(fileurl: string): string | void {
  let tmp = fileURLToPath(fileurl);
  if (existsSync(tmp)) return fileurl;
}

const root = new URL('file:///' + process.cwd() + '/');
export const resolve: Resolve = async function (specifier, context, defaultResolve) {
  // ignore "prefix:" and non-relative identifiers
  if (/^\w+\:?/.test(specifier)) return defaultResolve(specifier, context, defaultResolve);

  let match: RegExpExecArray | null;
  let idx: number, ext: Extension, path: string | void;
  let output = new URL(specifier, context.parentURL || root);

  // source ident includes extension
  if ((match = EXTN.exec(output.href))) {
    ext = match[0] as Extension;
    if (!context.parentURL || isTS.test(ext)) {
      return { url: output.href };
    }
    // source ident exists
    path = check(output.href);
    if (path) return { url: path };
    // parent importer is a ts file
    // source ident is js & NOT exists
    if (isJS.test(ext) && isTS.test(context.parentURL)) {
      // reconstruct ".js" -> ".ts" source file
      path = output.href.substring(0, (idx = match.index));
      if ((path = check(path + ext.replace('js', 'ts')))) {
        idx += ext.length;
        if (idx > output.href.length) {
          path += output.href.substring(idx);
        }
        return { url: path };
      }
      // return original, let it error
      return defaultResolve(specifier, context, defaultResolve);
    }
  }

  config = config || (await getConfig());

  for (ext in config) {
    path = check(output.href + ext);
    if (path) return { url: path };
  }

  return defaultResolve(specifier, context, defaultResolve);
};

export const getFormat: Inspect | undefined = HAS_UPDATED_HOOKS
  ? undefined
  : async function (uri, context, fallback) {
      let options = await toOptions(uri);
      if (options == null) return fallback(uri, context, fallback);
      return { format: options.format === 'cjs' ? 'commonjs' : 'module' };
    };

export const load: Load = async function (url, context, defaultLoad) {
  let options = await toOptions(url);

  if (options == null) return defaultLoad(url, context, defaultLoad);

  const format = options.format === 'cjs' ? 'commonjs' : 'module';

  const rawSource = await promises.readFile(new URL(url));

  esbuild = esbuild || (await import('esbuild'));

  const { code: source } = await esbuild.transform(rawSource.toString(), {
    ...options,
    sourcefile: url,
    format: format === 'module' ? 'esm' : 'cjs',
  });

  return {
    format,
    source,
  };
};

export const transformSource: Transform | undefined = HAS_UPDATED_HOOKS
  ? undefined
  : async function (source, context, xform) {
      let options = await toOptions(context.url);
      if (options == null) return xform(source, context, xform);

      // TODO: decode SAB/U8 correctly
      esbuild = esbuild || (await import('esbuild'));
      let result = await esbuild.transform(source.toString(), {
        ...options,
        sourcefile: context.url,
        format: context.format === 'module' ? 'esm' : 'cjs',
      });

      return { source: result.code };
    };
