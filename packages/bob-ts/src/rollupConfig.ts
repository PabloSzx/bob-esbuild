import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import { resolve } from 'path';
import type { InputOptions, OutputOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import { cleanEmptyFoldersRecursively } from './clean';
import { getPackageJson } from './packageJson';

export interface RollupConfig {
  entryPoints: string[];
  format: 'cjs' | 'esm' | 'interop';
  outDir: string;
  clean?: boolean;
}

export const getRollupConfig = async ({ entryPoints, format, outDir, clean }: RollupConfig) => {
  const dir = resolve(outDir);

  const { globby } = await import('globby');
  const target: string = 'es2019';

  const input = (
    await globby(entryPoints, {
      absolute: true,
      ignore: ['**/node_modules'],
    })
  ).filter(v => v.endsWith('.ts') && !v.endsWith('.d.ts'));

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
              await cleanEmptyFoldersRecursively(dir);
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
            sourcemap: true,
            preferConst: true,
          },
          {
            format: 'esm',
            dir,
            entryFileNames: esmEntryFileNames,
            preserveModules: true,
            exports: 'auto',
            sourcemap: true,
            preferConst: true,
          },
        ]
      : [
          {
            format,
            dir,
            entryFileNames: format === 'esm' ? esmEntryFileNames : cjsEntryFileNames,
            preserveModules: true,
            exports: 'auto',
            sourcemap: true,
            preferConst: true,
          },
        ];

  return {
    inputOptions,
    outputOptions,
  };
};
