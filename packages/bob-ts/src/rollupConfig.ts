import { bobEsbuildPlugin, EsbuildPluginOptions } from 'bob-esbuild-plugin';
import { resolve } from 'path';
import type { InputOptions, OutputOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import { cleanEmptyFoldersRecursively } from './clean';
import { existsSync } from 'fs';
import { getPackageJson } from './packageJson';

export interface RollupConfig {
  entryPoints: string[];
  format: 'cjs' | 'esm' | 'interop';
  outDir: string;
  clean: boolean;
  target: string;
  esbuild?: EsbuildPluginOptions;
  sourcemap?: OutputOptions['sourcemap'] & EsbuildPluginOptions['sourceMap'];
  rollup?: Partial<OutputOptions>;
}

export const getRollupConfig = async ({
  entryPoints,
  format,
  outDir,
  clean,
  target,
  esbuild,
  sourcemap = true,
  rollup,
}: RollupConfig) => {
  const dir = resolve(outDir);

  const { globby } = await import('globby');

  const input = (
    await globby(
      entryPoints.map(v => v.replace(/\\/g, '/')),
      {
        absolute: true,
        ignore: ['**/node_modules'],
      }
    )
  ).filter(v => v.endsWith('.tsx') || (v.endsWith('.ts') && !v.endsWith('.d.ts')));

  const inputOptions: InputOptions = {
    input,
    plugins: [
      {
        name: 'External Node Modules',
        resolveId(source, importer) {
          if (!importer || source.startsWith('./') || source.startsWith('/') || source.startsWith('../')) return null;

          return false;
        },
      },
      {
        name: 'keep-dynamic-import',
        renderDynamicImport() {
          return {
            left: 'import(',
            right: ')',
          };
        },
      },
      bobEsbuildPlugin({
        target,
        sourceMap: sourcemap,
        ...esbuild,
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
    ],
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
