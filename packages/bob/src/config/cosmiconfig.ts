import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs';
import { dirname } from 'path';
import { transform } from 'sucrase';

import { error } from '../log/error';
import { importFromString } from '../utils/importFromString';

import type { Plugin, InputOptions, OutputOptions } from 'rollup';
import type { ConfigOptions } from './rollup';
import type { TSCOptions } from '../tsc/types';
import type { EsbuildPluginOptions } from 'bob-esbuild-plugin';
import type { ExternalsOptions } from 'rollup-plugin-node-externals';

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

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
      const { code } = transform(content, {
        filePath: filepath,
        transforms: ['imports', 'typescript'],
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
