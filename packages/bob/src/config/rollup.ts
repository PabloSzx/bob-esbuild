import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import path from 'path';
import del from 'rollup-plugin-delete';
import externals from 'rollup-plugin-node-externals';

import { debug } from '../log/debug';
import { copyToDist } from './copyToDist';
import { globalConfig } from './cosmiconfig';
import { GetPackageBuildConfig } from './packageBuildConfig';
import { generatePackageJson } from './packageJson';
import { rollupBin } from './rollupBin';

import type { RollupBuild } from 'rollup';
import type { OutputOptions, InputOptions, Plugin } from 'rollup';

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
   * Enable bundling every entry point (no code-splitting available yet)
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
}

export async function getRollupConfig(options: ConfigOptions = {}) {
  const cwd = options.cwd || process.cwd();

  const buildConfigPromise = GetPackageBuildConfig(cwd);

  const { config: globalOptions } = await globalConfig;

  const clean = options.clean ?? globalOptions.clean;

  const inputFiles = options.inputFiles || (await buildConfigPromise).input || globalOptions.inputFiles || ['src/**/*.{ts,tsx}'];

  if (!inputFiles.length) throw Error('No input files to check!');

  const distDir = globalOptions.distDir;

  const globbyPkg = await import('globby');

  const globby = globbyPkg.default || (globbyPkg as any).globby;

  const input = (
    await Promise.all(
      inputFiles.map(pattern => {
        const glob = path.join(cwd, pattern).replace(/\\/g, '/');
        debug('Checking glob pattern: ' + glob);
        return globby(glob);
      })
    )
  )
    .flat()
    .filter((file, index, self) => self.indexOf(file) === index);

  if (!input.length) throw Error('No input files found!');

  debug('Building', input.join(' | '));

  const experimentalBundling = options.bundle ?? globalOptions.bundle ?? false;

  if (options.onlyESM && options.onlyCJS) throw Error('You can only restrict to either one of CJS or ESM');

  const absoluteDistDir = path.resolve(cwd, distDir);

  const cjsOpts: OutputOptions = {
    dir: absoluteDistDir,
    format: 'cjs',
    preserveModules: true,
    exports: 'auto',
    sourcemap: false,
    preferConst: true,
    ...globalOptions.outputOptions,
  };

  const esmOpts: OutputOptions = {
    dir: absoluteDistDir,
    format: 'es',
    entryFileNames: '[name].mjs',
    preserveModules: true,
    sourcemap: false,
    preferConst: true,
    ...globalOptions.outputOptions,
  };

  const outputOptions: OutputOptions[] = options.onlyCJS ? [cjsOpts] : options.onlyESM ? [esmOpts] : [cjsOpts, esmOpts];

  const buildConfig = await buildConfigPromise;

  if (buildConfig.copy?.length) debug(`Copying ${buildConfig.copy.join(' | ')} to ${absoluteDistDir}`);

  const genPackageJson = generatePackageJson({ packageJson: buildConfig.pkg, distDir, cwd });

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
  const inputOptions: InputOptions = {
    input,
    plugins,
    ...globalOptions.inputOptions,
  };

  async function write(bundle: RollupBuild) {
    await Promise.all(outputOptions.map(output => bundle.write(output)));
  }

  return { inputOptions, outputOptions, write };
}
