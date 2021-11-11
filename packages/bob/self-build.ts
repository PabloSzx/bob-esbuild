import { build } from 'esbuild';
import { promises } from 'fs';
import { resolve } from 'path';
import { startBuild } from './src/build';

async function main() {
  await startBuild({
    rollup: {
      external: ['../deps.js', './deps.js'],
      clean: true,
      globbyOptions: {
        ignore: [resolve('./src/deps.ts')],
      },
    },
  });

  await build({
    bundle: true,
    format: 'cjs',
    target: 'node13.2',
    entryPoints: ['src/deps.ts'],
    outdir: 'lib',
    platform: 'node',
    minify: true,
    external: ['rollup', 'fsevents'],
  });

  await promises.writeFile('./lib/deps.js', (await promises.readFile('./lib/deps.js', 'utf-8')).replace(/"node:/g, '"'), 'utf-8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
