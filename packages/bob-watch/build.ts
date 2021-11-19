import { build } from 'esbuild';
import { promises } from 'fs';
import { buildTsc } from '../bob/src/index';
import { rewritePackageJson } from '../bob/src/config/packageJson';
import { buildCode } from '../bob-ts/src/build';
import pkg from './package.json';

async function main() {
  await promises.rm('lib', {
    force: true,
    recursive: true,
  });
  await promises.mkdir('lib');
  await Promise.all([
    buildCode({
      entryPoints: ['./src/index.ts'],
      clean: false,
      format: 'interop',
      outDir: 'lib',
      target: 'node13.2',
      esbuild: {
        define: {
          VERSION: JSON.stringify(pkg.version),
        },
        minify: false,
      },
      sourcemap: false,
      external: ['./deps.js'],
    }),
    buildCode({
      entryPoints: ['./src/bin.ts'],
      clean: false,
      format: 'esm',
      outDir: 'lib',
      target: 'node13.2',
      esbuild: {
        define: {
          VERSION: JSON.stringify(pkg.version),
        },
        minify: false,
      },
      sourcemap: false,
      external: ['./deps.js'],
      rollup: {
        banner: '#!/usr/bin/env node\n',
      },
    }),
    build({
      bundle: true,
      format: 'cjs',
      target: 'node13.2',
      entryPoints: ['src/deps.ts'],
      outdir: 'lib',
      platform: 'node',
      minify: true,
      external: ['fsevents'],
    }),
    buildTsc(),
    promises.writeFile(
      'lib/package.json',
      JSON.stringify(
        rewritePackageJson(
          {
            ...pkg,
            bin: {
              'bob-watch': './bin.mjs',
            },
          },
          'lib'
        ),
        null,
        2
      ),
      'utf-8'
    ),
    promises.copyFile('README.md', 'lib/README.md'),
    promises.copyFile('LICENSE', 'lib/LICENSE'),
  ]);

  await promises.writeFile('./lib/deps.js', (await promises.readFile('./lib/deps.js', 'utf-8')).replace(/"node:/g, '"'), 'utf-8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
