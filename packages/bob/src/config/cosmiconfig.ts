import type { EsbuildPluginOptions } from 'bob-esbuild-plugin';
import { transform } from 'esbuild';
import fs from 'fs';
import { dirname } from 'path';
import type { InputOptions, OutputOptions, Plugin } from 'rollup';
import { cosmiconfig } from '../deps.js';
import { error } from '../log/error';
import type { TSCOptions } from '../tsc/types';
import { importFromString } from '../utils/importFromString';
import type { PackageJSON } from './packageJson';
import type { ConfigOptions } from './rollup';

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface ExternalsOptions {
  /**
   * Path/to/your/package.json file (or array of paths).
   * Defaults to all package.json files found in parent directories recursively.
   * Won't got outside of a git repository.
   */
  packagePath?: string | string[];
  /** Mark node built-in modules like `path`, `fs`... as external. Defaults to `true`. */
  builtins?: boolean;
  /** Mark dependencies as external. Defaults to `false`. */
  deps?: boolean;
  /** Mark devDependencies as external. Defaults to `true`. */
  devDeps?: boolean;
  /** Mark peerDependencies as external. Defaults to `true`. */
  peerDeps?: boolean;
  /** Mark optionalDependencies as external. Defaults to `true`. */
  optDeps?: boolean;
  /** Force these deps in the list of externals, regardless of other settings. Defaults to `[]`  */
  include?: string | RegExp | (string | RegExp)[];
  /** Exclude these deps from the list of externals, regardless of other settings. Defaults to `[]`  */
  exclude?: string | RegExp | (string | RegExp)[];
  /** @deprecated Use `exclude` instead. */
  except?: string | RegExp | (string | RegExp)[];
}

export interface BobConfig extends Pick<ConfigOptions, 'clean' | 'inputFiles' | 'bundle' | 'onlyCJS' | 'onlyESM'> {
  tsc?: TSCOptions;
  /**
   * It defaults to bob-esbuild.config directory
   */
  rootDir?: string;

  /**
   * @default "dist"
   */
  distDir?: string;

  plugins?: Plugin[];

  /**
   * Disable monorepo features and validations
   *
   * @default false
   */
  singleBuild?: boolean;

  inputOptions?: InputOptions;

  outputOptions?: Omit<OutputOptions, 'format'>;

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
   * @default false
   */
  keepDynamicImport?: boolean | string[] | ((moduleName: string) => boolean);

  /**
   * Skip automatic TSC build, make sure to manually call `bob-esbuild tsc`
   *
   * @default false
   */
  skipAutoTSCBuild?: boolean;

  /**
   * Custom esbuild plugin options
   *
   * Set as `false` to not include esbuild plugin
   */
  esbuildPluginOptions?: EsbuildPluginOptions | false;

  externalOptions?: ExternalsOptions;
  /**
   * Enabled debugging logs
   */
  verbose?: boolean;

  /**
   * Manually rewrite package json and skip validation
   */
  manualRewritePackageJson?: Record<string, (packageJson: PackageJSON) => Promise<PackageJSON> | PackageJSON>;

  /**
   * Set configurations for specific packages
   */
  packageConfigs?: Record<string, Omit<ConfigOptions, 'cwd'>>;

  /**
   * @default false
   */
  useTsconfigPaths?: boolean;
}

export type ResolvedBobConfig = PickRequired<BobConfig, 'rootDir' | 'clean' | 'distDir'>;

export interface CosmiConfigResult {
  filepath: string;
  config: ResolvedBobConfig;
}

export const globalConfig: Promise<CosmiConfigResult> & {
  current?: CosmiConfigResult;
} = cosmiconfig('bob-esbuild', {
  searchPlaces: ['bob-esbuild.config.ts'],
  loaders: {
    '.ts': async filepath => {
      const content = await fs.promises.readFile(filepath, 'utf8');
      const { code } = await transform(content, {
        loader: 'ts',
        format: 'cjs',
        sourcemap: 'inline',
        target: 'node12.20',
      });
      return importFromString(code, filepath)?.config;
    },
  },
})
  .search()
  .then((result): CosmiConfigResult => {
    if (!result) throw Error('Config could not be found!');

    const filepath = result.filepath;
    const config: ResolvedBobConfig = result.config;

    config.rootDir = config.rootDir || dirname(filepath).replace(/\\/g, '/');
    config.clean = config.clean ?? true;
    config.distDir = config.distDir || 'dist';
    config.keepDynamicImport ??= false;
    config.singleBuild ??= false;

    const data = {
      filepath,
      config,
    };

    globalConfig.current = data;

    return data;
  })
  .catch(err => {
    error(err);
    process.exit(1);
  });
