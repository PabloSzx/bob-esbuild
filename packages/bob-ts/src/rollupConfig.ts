import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
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
}

export const getRollupConfig = async ({ entryPoints, format, outDir, clean, target }: RollupConfig) => {
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
        sourceMap: true,
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
