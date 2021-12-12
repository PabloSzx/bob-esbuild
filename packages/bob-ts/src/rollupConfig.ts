import { bobEsbuildPlugin, EsbuildPluginOptions } from 'bob-esbuild-plugin';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ExternalOption, InputOptions, OutputOptions } from 'rollup';
import type { CompilerOptions } from 'typescript';
import { cleanEmptyFoldersRecursively } from './clean';
import { del, globby, rollupJson, tsconfigPaths, externals } from './deps.js';
import { getPackageJson } from './packageJson';

export interface TsConfigPayload {
  compilerOptions: CompilerOptions;
  fileNames?: string[];
}

export interface RollupConfig {
  entryPoints: string[];
  format: 'cjs' | 'esm' | 'interop';
  outDir: string;
  clean: boolean;
  target: string;
  esbuild?: EsbuildPluginOptions;
  sourcemap?: OutputOptions['sourcemap'] & EsbuildPluginOptions['sourceMap'];
  rollup?: Partial<OutputOptions>;
  paths?:
    | boolean
    | {
        tsConfigPath: string | string[] | TsConfigPayload | TsConfigPayload[];
        logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
        colors: boolean;
        strict: boolean;
        respectCoreModule: boolean;
      };
  external?: ExternalOption;
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
  paths,
  external,
}: RollupConfig) => {
  const dir = resolve(outDir);

  const input = (
    await globby(
      entryPoints.map(v => v.replace(/\\/g, '/')),
      {
        absolute: true,
        ignore: ['**/node_modules'],
      }
    )
  ).filter(file => !!file.match(/\.(js|cjs|mjs|ts|tsx|cts|mts|ctsx|mtsx)$/));

  const inputOptions: InputOptions = {
    input,
    plugins: [
      externals({
        packagePath: resolve(process.cwd(), 'package.json'),
        deps: true,
      }),
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
      rollupJson({
        preferConst: true,
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
      paths && tsconfigPaths(typeof paths === 'boolean' ? undefined : paths),
    ],
    external,
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
