import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import path, { join, resolve } from 'path';
import type { ExternalOption, InputOptions, OutputOptions, Plugin, RollupBuild } from 'rollup';
import { del, externals, globby, tsconfigPaths as tsPaths } from '../deps.js';
import { debug } from '../log/debug';
import { cleanObject } from '../utils/object';
import { retry } from '../utils/retry';
import { copyToDist } from './copyToDist';
import { globalConfig } from './cosmiconfig';
import { GetPackageBuildConfig } from './packageBuildConfig';
import { generatePackageJson } from './packageJson';
import { rollupBin } from './rollupBin';

export interface ConfigOptions {
  /**
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * By default it's `true` in global config
   */
  clean?: boolean;
  /**
   * Input files
   *
   * By default it takes every ".ts" file inside src
   */
  inputFiles?: string[];
  /**
   * Enable bundling every entry point (no code-splitting available)
   *
   * @default false
   */
  bundle?: boolean;

  /**
   * Only build CJS
   * @default false
   */
  onlyCJS?: boolean;

  /**
   * Only build ESM
   * @default false
   */
  onlyESM?: boolean;

  /**
   * Skip package.json validate
   *
   * @default false
   */
  skipValidate?: boolean;

  /**
   * Customize external imports
   */
  external?: ExternalOption;

  /**
   * Customize globby options
   */
  globbyOptions?: {
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
     * The current working directory in which to search.
     *
     * @default process.cwd()
     */
    cwd?: string;
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
  };
}

export async function getRollupConfig(optionsArg: ConfigOptions = {}) {
  const cwd = optionsArg.cwd ? resolve(optionsArg.cwd) : process.cwd();

  const [buildConfig, { config: globalOptions }] = await Promise.all([GetPackageBuildConfig(cwd), globalConfig]);

  const options = { ...globalOptions.packageConfigs?.[buildConfig.pkg.name], ...cleanObject(optionsArg) };

  const clean = options.clean ?? globalOptions.clean;

  const inputFiles = options.inputFiles || buildConfig.input || globalOptions.inputFiles || ['src/**/*.{ts,tsx}'];

  if (!inputFiles.length) throw Error('No input files to check!');

  const distDir = globalOptions.distDir;

  const input = await retry(async () =>
    (
      await Promise.all(
        inputFiles.map(pattern => {
          const glob = path.join(cwd, pattern).replace(/\\/g, '/');
          debug('Checking glob pattern: ' + glob);
          return globby(glob, options.globbyOptions);
        })
      )
    )
      .flat()
      .filter((file, index, self) => self.indexOf(file) === index)
  );

  if (!input.length) throw Error('No input files found!');

  debug('Building', input.join(' | '));

  const experimentalBundling = options.bundle ?? globalOptions.bundle ?? false;

  if (options.onlyESM && options.onlyCJS) throw Error('You can only restrict to either one of CJS or ESM');

  const absoluteDistDir = path.resolve(cwd, distDir);

  const typeModule = buildConfig.pkg.type === 'module';

  const cjsOpts: OutputOptions = {
    dir: absoluteDistDir,
    format: 'cjs',
    entryFileNames: typeModule ? '[name].cjs' : '[name].js',
    preserveModules: true,
    exports: 'auto',
    sourcemap: false,
    preferConst: true,
    ...globalOptions.outputOptions,
  };

  const esmOpts: OutputOptions = {
    dir: absoluteDistDir,
    format: 'es',
    entryFileNames: typeModule ? '[name].js' : '[name].mjs',
    preserveModules: true,
    sourcemap: false,
    preferConst: true,
    ...globalOptions.outputOptions,
  };

  const outputOptions: OutputOptions[] = options.onlyCJS ? [cjsOpts] : options.onlyESM ? [esmOpts] : [cjsOpts, esmOpts];

  if (buildConfig.copy?.length) debug(`Copying ${buildConfig.copy.join(' | ')} to ${absoluteDistDir}`);

  const genPackageJson = generatePackageJson(
    { packageJson: buildConfig.pkg, distDir, cwd, skipValidate: options.skipValidate },
    globalOptions
  );

  const plugins: Plugin[] = [
    externals({
      packagePath: path.resolve(cwd, 'package.json'),
      deps: true,
      ...globalOptions.externalOptions,
    }),
    rollupBin(buildConfig, cwd),
    ...(globalOptions.plugins || []),
  ];

  if (genPackageJson) {
    plugins.push(genPackageJson);
  }

  const copyDistFiles = buildConfig.copy || [];

  if (genPackageJson) {
    plugins.push(
      copyToDist({
        cwd,
        distDir,
        files: ['README.md', 'LICENSE', ...copyDistFiles],
      })
    );
  } else if (copyDistFiles.length) {
    plugins.push(
      copyToDist({
        cwd,
        distDir,
        files: copyDistFiles,
      })
    );
  }

  const keepDynamicImport = globalOptions.keepDynamicImport;

  if (keepDynamicImport) {
    if (Array.isArray(keepDynamicImport)) {
      plugins.push({
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
      plugins.push({
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
      plugins.push({
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

  if (globalOptions.esbuildPluginOptions !== false) {
    plugins.push(
      bobEsbuildPlugin({
        target: 'es2019',
        sourceMap: false,
        experimentalBundling,
        ...globalOptions.esbuildPluginOptions,
      })
    );
  }

  if (clean) {
    plugins.push(
      del({
        targets: [`${distDir}/**/*.js`, `${distDir}/**/*.mjs`, `${distDir}/**/*.map`],
        cwd,
      })
    );
  }

  if (globalOptions.useTsconfigPaths) {
    plugins.push(
      tsPaths({
        tsConfigPath: join(globalOptions.rootDir, 'tsconfig.json'),
      })
    );
  }

  const inputOptions: InputOptions = {
    input,
    plugins,
    external: options.external,
    ...cleanObject(globalOptions.inputOptions),
  };

  async function write(bundle: RollupBuild) {
    await Promise.all(outputOptions.map(output => bundle.write(output)));
  }

  return { inputOptions, outputOptions, write };
}
