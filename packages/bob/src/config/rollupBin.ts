import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import { resolve } from 'path';
import type { Plugin, InputOptions } from 'rollup';
import { externals, get, rollupJson } from '../deps.js';
import { debug } from '../log/debug';
import { globalConfig } from './cosmiconfig';
import type { PackageBuildConfig } from './packageBuildConfig';

export const rollupBin = (buildConfig: PackageBuildConfig, cwd: string = process.cwd()): Plugin => {
  const pending: Promise<PromiseSettledResult<void>[]>[] = [];

  return {
    name: 'RollupBin',
    async buildStart() {
      const {
        config: { distDir, externalOptions, esbuildPluginOptions },
      } = await globalConfig;
      if (buildConfig.bin) {
        const { rollup } = await import('rollup');
        pending.push(
          Promise.allSettled(
            Object.entries(buildConfig.bin).map(async ([alias, options]) => {
              if (typeof options.input !== 'string') throw Error(`buildConfig.${alias} expected to have an input field`);

              const inputOptions: InputOptions = {
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
                  rollupJson({
                    preferConst: true,
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
                format: binOutputFile.endsWith('.mjs')
                  ? 'es'
                  : binOutputFile.endsWith('.cjs')
                  ? 'cjs'
                  : buildConfig.pkg.type === 'module'
                  ? 'es'
                  : 'cjs',
              });

              debug(`Bin ${alias} built in ${binOutputFile}`);
            })
          )
        );
      }
    },
    async buildEnd() {
      await Promise.all(
        pending.map(pendingPromises =>
          pendingPromises.then(async promises => {
            return Promise.all(
              promises.map(async result => {
                if (result.status === 'rejected') throw result.reason;
              })
            );
          })
        )
      );
    },
  };
};
