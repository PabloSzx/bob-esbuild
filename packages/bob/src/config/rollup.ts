import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import globby from 'globby';
import path from 'path';
import del from 'rollup-plugin-delete';
import externals from 'rollup-plugin-node-externals';

import { debug } from '../log/debug';
import { generatePackageJson } from './packageJson';
import { globalConfig } from './cosmiconfig';

import type { RollupBuild } from 'rollup';
import type { OutputOptions, RollupOptions, Plugin } from 'rollup';

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
}

export async function getRollupConfig(options: ConfigOptions = {}) {
  const { config: globalOptions } = await globalConfig;

  const cwd = options.cwd || process.cwd();

  const clean = options.clean ?? globalOptions.clean;

  const inputFiles = options.inputFiles || globalOptions.inputFiles || ['src/**/*.{ts,tsx}'];

  if (!inputFiles.length) throw Error('No input files to check!');

  const distDir = globalOptions.distDir;

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

  const outputOptions: OutputOptions[] = [
    {
      dir: path.resolve(cwd, distDir),
      format: 'cjs',
      preserveModules: true,
      exports: 'auto',
      sourcemap: true,
      preferConst: true,
      ...globalOptions.outputOptions,
    },
    {
      dir: path.resolve(cwd, distDir),
      format: 'es',
      entryFileNames: '[name].mjs',
      preserveModules: true,
      sourcemap: true,
      preferConst: true,
      ...globalOptions.outputOptions,
    },
  ];

  const plugins: Plugin[] = [
    externals({
      packagePath: path.resolve(cwd, 'package.json'),
      deps: true,
      ...globalOptions.externalOptions,
    }),
    generatePackageJson(distDir),
    ...(globalOptions.plugins || []),
  ];

  if (globalOptions.esbuildPluginOptions !== false) {
    plugins.push(
      bobEsbuildPlugin({
        target: 'es2019',
        sourceMap: true,
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
  const rollupConfig: RollupOptions = {
    input,
    plugins,
    ...globalOptions.rollupOptions,
  };

  async function write(bundle: RollupBuild) {
    await Promise.all(outputOptions.map(output => bundle.write(output)));
  }

  return { config: rollupConfig, outputOptions, write };
}
