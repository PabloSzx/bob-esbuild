import { bobEsbuildPlugin, EsbuildPluginOptions } from 'bob-esbuild-plugin';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ExternalOption, InputOptions, OutputOptions } from 'rollup';
import type { CompilerOptions } from 'typescript';
import { cleanEmptyFoldersRecursively } from './clean';
import { del, globby, rollupJson, tsconfigPaths, externals } from './deps.js';
import { getPackageJson } from './packageJson';

export interface TsConfigPayload {
  compilerOptions: CompilerOptions;
  fileNames: string[];
}

export interface GlobbyOptions {
  /**
   * Return the absolute path for entries.
   *
   * @default false
   */
  absolute?: boolean;
  /**
   * If set to `true`, then patterns without slashes will be matched against
   * the basename of the path if it contains slashes.
   *
   * @default false
   */
  baseNameMatch?: boolean;
  /**
   * Enables Bash-like brace expansion.
   *
   * @default true
   */
  braceExpansion?: boolean;
  /**
   * Enables a case-sensitive mode for matching files.
   *
   * @default true
   */
  caseSensitiveMatch?: boolean;
  /**
   * Specifies the maximum number of concurrent requests from a reader to read
   * directories.
   *
   * @default os.cpus().length
   */
  concurrency?: number;
  /**
   * Specifies the maximum depth of a read directory relative to the start
   * directory.
   *
   * @default Infinity
   */
  deep?: number;
  /**
   * Allow patterns to match entries that begin with a period (`.`).
   *
   * @default false
   */
  dot?: boolean;
  /**
   * Enables Bash-like `extglob` functionality.
   *
   * @default true
   */
  extglob?: boolean;
  /**
   * Indicates whether to traverse descendants of symbolic link directories.
   *
   * @default true
   */
  followSymbolicLinks?: boolean;
  /**
   * Custom implementation of methods for working with the file system.
   *
   * @default fs.*
   */
  fs?: any;
  /**
   * Enables recursively repeats a pattern containing `**`.
   * If `false`, `**` behaves exactly like `*`.
   *
   * @default true
   */
  globstar?: boolean;
  /**
   * An array of glob patterns to exclude matches.
   * This is an alternative way to use negative patterns.
   *
   * @default []
   */
  ignore?: string[];
  /**
   * Mark the directory path with the final slash.
   *
   * @default false
   */
  markDirectories?: boolean;
  /**
   * Returns objects (instead of strings) describing entries.
   *
   * @default false
   */
  objectMode?: boolean;
  /**
   * Return only directories.
   *
   * @default false
   */
  onlyDirectories?: boolean;
  /**
   * Return only files.
   *
   * @default true
   */
  onlyFiles?: boolean;
  /**
   * Enables an object mode (`objectMode`) with an additional `stats` field.
   *
   * @default false
   */
  stats?: boolean;
  /**
   * By default this package suppress only `ENOENT` errors.
   * Set to `true` to suppress any error.
   *
   * @default false
   */
  suppressErrors?: boolean;
  /**
   * Throw an error when symbolic link is broken if `true` or safely
   * return `lstat` call if `false`.
   *
   * @default false
   */
  throwErrorOnBrokenSymbolicLink?: boolean;
  /**
   * Ensures that the returned entries are unique.
   *
   * @default true
   */
  unique?: boolean;
  /**
	If set to `true`, `globby` will automatically glob directories for you. If you define an `Array` it will only glob files that matches the patterns inside the `Array`. You can also define an `Object` with `files` and `extensions` like in the example below.

	Note that if you set this option to `false`, you won't get back matched directories unless you set `onlyFiles: false`.

	@default true

	@example
	```
	import {globby} from 'globby';

	const paths = await globby('images', {
		expandDirectories: {
			files: ['cat', 'unicorn', '*.jpg'],
			extensions: ['png']
		}
	});

	console.log(paths);
	//=> ['cat.png', 'unicorn.png', 'cow.jpg', 'rainbow.jpg']
	```
	*/
  readonly expandDirectories?: boolean | readonly string[] | { files?: readonly string[]; extensions?: readonly string[] };

  /**
	Respect ignore patterns in `.gitignore` files that apply to the globbed files.

	@default false
	*/
  readonly gitignore?: boolean;

  /**
	Glob patterns to look for ignore files, which are then used to ignore globbed files.

	This is a more generic form of the `gitignore` option, allowing you to find ignore files with a [compatible syntax](http://git-scm.com/docs/gitignore). For instance, this works with Babel's `.babelignore`, Prettier's `.prettierignore`, or ESLint's `.eslintignore` files.

	@default undefined
	*/
  readonly ignoreFiles?: string | readonly string[];

  /**
	The current working directory in which to search.

	@default process.cwd()
	*/
  readonly cwd?: URL | string;
}

export interface RollupConfig {
  entryPoints: string[];
  globbyOptions?: GlobbyOptions;
  format: 'cjs' | 'esm' | 'interop';
  outDir: string;
  clean: boolean;
  target: string;
  esbuild?: EsbuildPluginOptions;
  sourcemap?: OutputOptions['sourcemap'] & EsbuildPluginOptions['sourceMap'];
  rollup?: Partial<OutputOptions>;
  paths?:
    | boolean
    | {
        tsConfigPath: string | string[] | TsConfigPayload | TsConfigPayload[];
        logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
        colors: boolean;
        strict: boolean;
        respectCoreModule: boolean;
      };
  external?: ExternalOption;
  /**
   * If dynamic imports `await import("foo")` should be kept as `import`
   * and NOT be transpiled as `await Promise.resolve(require("foo"))`
   *
   * This is specially useful when is needed to import an `ES Module` from `CommonJS`,
   * for example, when an external package has `"type": "module"`.
   *
   * If an array of strings is specified, the dynamic imports are only kept
   * for those specified modules
   *
   * @default true
   */
  keepDynamicImport?: boolean | string[] | ((moduleName: string) => boolean);
  plugins?: InputOptions['plugins'];
  inputOptions?: Omit<InputOptions, 'plugins' | 'external' | 'input'>;
}

export const getRollupConfig = async ({
  entryPoints,
  globbyOptions,
  format,
  outDir,
  clean,
  target,
  esbuild,
  sourcemap = true,
  rollup,
  paths,
  external,
  keepDynamicImport = true,
  inputOptions: customInputOptions,
  plugins: customPlugins,
}: RollupConfig) => {
  const dir = resolve(outDir);

  const input = (
    await globby(
      entryPoints.map(v => v.replace(/\\/g, '/')),
      {
        absolute: true,
        ignore: ['**/node_modules'],
        ...globbyOptions,
      }
    )
  ).filter(file => !!file.match(/\.(js|cjs|mjs|ts|tsx|cts|mts|ctsx|mtsx)$/));

  const plugins: InputOptions['plugins'] = [
    ...(customPlugins || []),
    externals({
      packagePath: resolve(process.cwd(), 'package.json'),
      deps: true,
    }),
    bobEsbuildPlugin({
      target,
      sourceMap: sourcemap,
      ...esbuild,
    }),
    rollupJson({
      preferConst: true,
    }),
    clean &&
      del({
        targets: [`${dir}/**/*.js`, `${dir}/**/*.mjs`, `${dir}/**/*.cjs`, `${dir}/**/*.map`],
      }),
    clean &&
      (() => {
        let deleted = false;

        return {
          name: 'Clean Empty Directories',
          async buildEnd() {
            if (deleted) return;
            deleted = true;
            if (existsSync(dir)) await cleanEmptyFoldersRecursively(dir);
          },
        };
      })(),
    paths && tsconfigPaths(typeof paths === 'boolean' ? undefined : paths),
  ];

  if (keepDynamicImport) {
    if (Array.isArray(keepDynamicImport)) {
      plugins.unshift({
        name: 'keep-dynamic-import',
        renderDynamicImport({ targetModuleId }) {
          if (!targetModuleId || !keepDynamicImport.includes(targetModuleId)) return null;

          return {
            left: 'import(',
            right: ')',
          };
        },
      });
    } else if (typeof keepDynamicImport === 'function') {
      plugins.unshift({
        name: 'keep-dynamic-import',
        renderDynamicImport({ targetModuleId }) {
          if (!targetModuleId || !keepDynamicImport(targetModuleId)) return null;

          return {
            left: 'import(',
            right: ')',
          };
        },
      });
    } else {
      plugins.unshift({
        name: 'keep-dynamic-import',
        renderDynamicImport() {
          return {
            left: 'import(',
            right: ')',
          };
        },
      });
    }
  }

  const inputOptions: InputOptions = {
    ...customInputOptions,
    input,
    plugins,
    external,
  };

  const isTypeModule = (await getPackageJson()).type === 'module';

  const cjsEntryFileNames = isTypeModule ? '[name].cjs' : undefined;
  const esmEntryFileNames = isTypeModule ? undefined : '[name].mjs';

  const outputOptions: OutputOptions[] =
    format === 'interop'
      ? [
          {
            format: 'cjs',
            dir,
            entryFileNames: cjsEntryFileNames,
            preserveModules: true,
            exports: 'auto',
            sourcemap,
            preferConst: true,
            ...rollup,
          },
          {
            format: 'esm',
            dir,
            entryFileNames: esmEntryFileNames,
            preserveModules: true,
            exports: 'auto',
            sourcemap,
            preferConst: true,
            ...rollup,
          },
        ]
      : [
          {
            format,
            dir,
            entryFileNames: format === 'esm' ? esmEntryFileNames : cjsEntryFileNames,
            preserveModules: true,
            exports: 'auto',
            sourcemap,
            preferConst: true,
            ...rollup,
          },
        ];

  return {
    inputOptions,
    outputOptions,
  };
};
