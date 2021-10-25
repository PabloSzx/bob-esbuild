import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import get from 'lodash.get';
import { resolve } from 'path';
import type { Plugin } from 'rollup';
import externals from 'rollup-plugin-node-externals';
import { debug } from '../log/debug';
import { globalConfig } from './cosmiconfig';
import type { PackageBuildConfig } from './packageBuildConfig';

const RollupBinSym = Symbol();

declare module 'rollup' {
  interface PluginContext {
    [RollupBinSym]?: Promise<unknown>;
  }
}

export const rollupBin = (buildConfig: PackageBuildConfig, cwd: string = process.cwd()): Plugin => {
  return {
    name: 'RollupBin',
    async buildStart() {
      const {
        config: { distDir, externalOptions, esbuildPluginOptions },
      } = await globalConfig;
      if (buildConfig.bin) {
        const { rollup } = await import('rollup');
        this[RollupBinSym] = Promise.all(
          Object.entries(buildConfig.bin).map(async ([alias, options]) => {
            if (typeof options.input !== 'string') throw Error(`buildConfig.${alias} expected to have an input field`);

            const inputOptions = {
              input: options.input,
              plugins: [
                externals({
                  packagePath: resolve(cwd, 'package.json'),
                  deps: true,
                  ...externalOptions,
                }),
                bobEsbuildPlugin({
                  target: 'es2019',
                  sourceMap: false,
                  experimentalBundling: true,
                  ...esbuildPluginOptions,
                }),
              ],
            };

            const pkgBin = get(buildConfig.pkg, ['bin', alias]);

            if (typeof pkgBin !== 'string') {
              throw Error(`Location on bin ${alias} could not be found!`);
            }

            const bundle = await rollup(inputOptions);

            const binOutputFile = resolve(cwd, distDir, pkgBin);
            await bundle.write({
              banner: `#!/usr/bin/env node`,
              preferConst: true,
              sourcemap: false,
              file: binOutputFile,
              format: 'cjs',
            });

            debug(`Bin ${alias} built in ${binOutputFile}`);
          })
        );
      }
    },
    async buildEnd() {
      await this[RollupBinSym];
    },
  };
};
