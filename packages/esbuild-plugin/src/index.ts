import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { formatMessages, Loader, Message, transform } from 'esbuild';
import { existsSync, statSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import type { Plugin, PluginContext } from 'rollup';
import { bundle } from './bundle';
import { getTypescriptConfig } from './options';

const defaultLoaders: { [ext: string]: Loader } = {
  '.js': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
};

export type EsbuildPluginOptions = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  sourceMap?: boolean | 'inline' | 'external' | 'both';
  minify?: boolean;
  minifyWhitespace?: boolean;
  minifyIdentifiers?: boolean;
  minifySyntax?: boolean;
  target?: string | string[];
  jsxFactory?: string;
  jsxFragment?: string;
  define?: {
    [k: string]: string;
  };
  experimentalBundling?: boolean;
  /**
   * Use this tsconfig file instead
   * Disable it by setting to `false`
   */
  tsconfig?: string | false;
  /**
   * Map extension to esbuild loader
   * Note that each entry (the extension) needs to start with a dot
   */
  loaders?: {
    [ext: string]: Loader | false;
  };
};

const warn = async (pluginContext: PluginContext, messages: Message[]) => {
  if (messages.length > 0) {
    const warnings = await formatMessages(messages, {
      kind: 'warning',
      color: true,
    });
    warnings.forEach(warning => pluginContext.warn(warning));
  }
};

export const bobEsbuildPlugin = (options: EsbuildPluginOptions = {}): Plugin => {
  let target: string | string[];

  const loaders = {
    ...defaultLoaders,
  };

  if (options.loaders) {
    for (const key of Object.keys(options.loaders)) {
      const value = options.loaders[key];
      if (typeof value === 'string') {
        loaders[key] = value;
      } else if (value === false) {
        delete loaders[key];
      }
    }
  }

  const extensions: string[] = Object.keys(loaders);
  const INCLUDE_REGEXP = new RegExp(`\\.(${extensions.map(ext => ext.slice(1)).join('|')})$`);
  const EXCLUDE_REGEXP = /node_modules/;

  const filter = createFilter(options.include || INCLUDE_REGEXP, options.exclude || EXCLUDE_REGEXP);

  const resolveFile = (resolved: string, index: boolean = false) => {
    for (const ext of extensions) {
      const file = index ? join(resolved, `index${ext}`) : `${resolved}${ext}`;
      if (existsSync(file)) return file;
    }
    return null;
  };

  let plugins: Plugin[] = [];

  return {
    name: 'esbuild',

    resolveId(importee, importer) {
      if (!importer && importee[0] === '.') return;

      const resolved = resolve(importer ? dirname(importer) : process.cwd(), importee);

      let file = resolveFile(resolved);
      if (file) return file;
      if (!file && existsSync(resolved) && statSync(resolved).isDirectory()) {
        file = resolveFile(resolved, true);
        if (file) return file;
      }
      return;
    },

    options(options) {
      plugins = options.plugins?.filter((v): v is Plugin => !!v && typeof v === 'object') || [];
      return null;
    },

    async load(id) {
      if (!options.experimentalBundling) return;

      const defaultOptions =
        options.target || options.tsconfig === false ? {} : await getTypescriptConfig(dirname(id), options.tsconfig);

      target = options.target || defaultOptions.target || 'es2019';

      const bundled = await bundle(id, this, plugins, loaders, target, {
        define: options.define,
      });

      if (!bundled.code) return;

      return {
        code: bundled.code,
        map: bundled.map,
      };
    },

    async transform(code, id) {
      // In bundle mode transformation is handled by esbuild too
      if (!filter(id) || options.experimentalBundling) {
        return null;
      }

      const ext = extname(id);
      const loader = loaders[ext];

      if (!loader) {
        return null;
      }

      const defaultOptions = options.tsconfig === false ? {} : await getTypescriptConfig(dirname(id), options.tsconfig);

      target = options.target || defaultOptions.target || 'es2019';

      const result = await transform(code, {
        loader,
        target,
        jsxFactory: options.jsxFactory || defaultOptions.jsxFactory,
        jsxFragment: options.jsxFragment || defaultOptions.jsxFragment,
        define: options.define,
        sourcemap: options.sourceMap,
        sourcefile: id,
      });

      await warn(this, result.warnings);

      return (
        result.code && {
          code: result.code,
          map: result.map || null,
        }
      );
    },

    async renderChunk(code) {
      if (options.minify || options.minifyWhitespace || options.minifyIdentifiers || options.minifySyntax) {
        const result = await transform(code, {
          loader: 'js',
          minify: options.minify,
          minifyWhitespace: options.minifyWhitespace,
          minifyIdentifiers: options.minifyIdentifiers,
          minifySyntax: options.minifySyntax,
          target,
          sourcemap: options.sourceMap,
        });
        await warn(this, result.warnings);
        if (result.code) {
          return {
            code: result.code,
            map: result.map || null,
          };
        }
      }
      return null;
    },
  };
};
