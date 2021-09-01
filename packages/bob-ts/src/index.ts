import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import { resolve } from 'path';
import { InputOptions, OutputOptions, rollup } from 'rollup';
import del from 'rollup-plugin-delete';
import { packageJsonPromise } from './packageJson';

export async function buildCode({
  entryPoints,
  format,
  outDir,
  clean,
}: {
  entryPoints: string[];
  format: 'cjs' | 'esm' | 'both';
  outDir: string;
  clean?: boolean;
}) {
  const dir = resolve(outDir);

  const { globby } = await import('globby');
  const target: string = 'es2019';
  const inputOptions: InputOptions = {
    input: (
      await globby(entryPoints, {
        absolute: true,
      })
    ).filter(v => v.endsWith('.ts')),
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
          targets: [`${dir}/**/*.js`, `${dir}/**/*.mjs`, `${dir}/**/*.map`],
        }),
    ],
  };
  const build = await rollup(inputOptions);

  const isTypeModule = (await packageJsonPromise).type === 'module';

  const cjsEntryFileNames = isTypeModule ? '[name].cjs' : undefined;
  const esmEntryFileNames = isTypeModule ? undefined : '[name].mjs';

  const outputOptions: OutputOptions[] =
    format === 'both'
      ? [
          {
            format: 'cjs',
            dir,
            entryFileNames: cjsEntryFileNames,
            exports: 'auto',
            sourcemap: true,
            preferConst: true,
          },
          {
            format: 'esm',
            dir,
            entryFileNames: esmEntryFileNames,
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

  await Promise.all(
    outputOptions.map(output => {
      return build.write(output);
    })
  );
}
