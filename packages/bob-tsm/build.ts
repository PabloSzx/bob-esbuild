import { build } from 'esbuild';
import { promises } from 'fs';
import { resolve } from 'path';
import { buildCode } from '../bob-ts/src/build';
import { writePackageJson } from '../bob/src/config/packageJson';
import { buildTsc } from '../bob/src/tsc/build';
import pkg from './package.json';

async function main() {
  await promises.rm('lib', {
    recursive: true,
    force: true,
  });

  const tscPromise = Promise.allSettled([buildTsc()]).then(v => v[0]);

  await promises.mkdir('lib', {
    recursive: true,
  });

  await Promise.all([
    buildCode({
      entryPoints: ['./src/require.ts'],
      clean: false,
      format: 'cjs',
      outDir: 'lib',
      target: 'node12.20',
      sourcemap: false,
      external: ['./deps/typescriptPaths.js'],
      esbuild: {
        minify: false,
      },
    }),
    buildCode({
      entryPoints: ['./src/loader.ts'],
      clean: false,
      format: 'esm',
      outDir: 'lib',
      target: 'node12.20',
      sourcemap: false,
      external: ['./deps/semver.js', './deps/typescriptPaths.js'],
      esbuild: {
        minify: false,
      },
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
      external: ['./deps/commander.js', './deps/treeKill.js', './deps/chokidar.js', './deps/typescriptPaths.js'],
      rollup: {
        banner: '#!/usr/bin/env node\n',
      },
    }),
    promises.readdir('./src/deps').then(relativeDeps => {
      const entryPoints = relativeDeps.map(v => resolve('./src/deps', v));

      return build({
        bundle: true,
        format: 'cjs',
        target: 'node12.20',
        entryPoints,
        outdir: 'lib/deps',
        platform: 'node',
        minify: true,
        external: ['fsevents', 'typescript'],
      });
    }),
    writePackageJson({
      packageJson: {
        ...pkg,
        bin: {
          'bob-tsm': './bin.mjs',
        },
      },
      distDir: 'lib',
    }),
    promises.copyFile('LICENSE', 'lib/LICENSE'),
    promises.copyFile('README.md', 'lib/README.md'),
  ]);
  await buildCode({
    entryPoints: ['./src/config.ts', './src/utils.ts'],
    clean: false,
    format: 'interop',
    outDir: 'lib',
    target: 'node12.20',
    sourcemap: false,
    esbuild: {
      minify: false,
    },
  });

  await tscPromise.then(v => {
    if (v.status === 'rejected') throw v.reason;
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
