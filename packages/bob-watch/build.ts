import { build } from 'esbuild';
import { promises } from 'fs';
import { buildCode } from '../bob-ts/src/build';
import { writePackageJson } from '../bob/src/config/packageJson';
import { buildTsc } from '../bob/src/index';
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
      target: 'node12.20',
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
      target: 'node12.20',
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
      target: 'node12.20',
      entryPoints: ['src/deps.ts'],
      outdir: 'lib',
      platform: 'node',
      minify: true,
      external: ['fsevents'],
    }),
    buildTsc(),
    writePackageJson({
      distDir: 'lib',
      packageJson: {
        ...pkg,
        bin: {
          'bob-watch': './bin.mjs',
        },
      },
    }),
    promises.copyFile('README.md', 'lib/README.md'),
    promises.copyFile('LICENSE', 'lib/LICENSE'),
  ]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
