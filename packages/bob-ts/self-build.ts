import { build } from 'esbuild';
import { promises } from 'fs';
import { resolve } from 'path';
import { startBuild } from '../bob/src/build';
import { writePackageJson } from '../bob/src/config/packageJson';
import { buildRollup } from '../bob/src/rollup/build';
import pkg from './package.json';

async function main() {
  await promises.rm('lib', {
    recursive: true,
    force: true,
  });
  await buildRollup({
    inputFiles: ['./src/bin'],
    outputOptions: {
      banner: '#!/usr/bin/env node\n',
    },
    clean: true,
    onlyESM: true,
  });
  await startBuild({
    rollup: {
      clean: false,
      globbyOptions: {
        ignore: [
          resolve('./src/bin/build.ts'),
          resolve('./src/bin/watch.ts'),
          resolve('./src/deps.ts'),
          resolve('./src/watchDeps.ts'),
        ].map(v => v.replace(/\\/g, '/')),
      },
    },
  });

  await build({
    bundle: true,
    format: 'cjs',
    target: 'node12.20',
    entryPoints: ['src/deps.ts', 'src/watchDeps.ts'],
    outdir: 'lib',
    platform: 'node',
    minify: true,
    external: ['rollup', 'fsevents', 'typescript'],
  });

  await Promise.all([
    writePackageJson({
      packageJson: {
        ...pkg,
        bin: {
          'bob-ts': './bin/build.mjs',
          'bob-ts-watch': './bin/watch.mjs',
        },
      },
      distDir: 'lib',
    }),
    promises.copyFile('LICENSE', 'lib/LICENSE'),
    promises.copyFile('README.md', 'lib/README.md'),
  ]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
