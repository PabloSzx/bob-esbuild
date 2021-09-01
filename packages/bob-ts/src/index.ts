import { bobEsbuildPlugin } from 'bob-esbuild-plugin';
import { resolve } from 'path';
import { InputOptions, OutputOptions, rollup } from 'rollup';
import del from 'rollup-plugin-delete';

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
          return importer && /[/^\.{0,2}\//]/.test(source) ? false : null;
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

  const outputOptions: OutputOptions[] =
    format === 'both'
      ? [
          {
            format: 'cjs',
            dir,
            exports: 'auto',
            sourcemap: true,
            preferConst: true,
          },
          {
            format: 'esm',
            dir,
            entryFileNames: '[name].mjs',
            exports: 'auto',
            sourcemap: true,
            preferConst: true,
          },
        ]
      : [
          {
            format,
            dir,
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
