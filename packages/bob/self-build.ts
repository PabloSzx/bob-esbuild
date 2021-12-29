import { build } from 'esbuild';
import { resolve } from 'path';
import { startBuild } from './src/build';

async function main() {
  await startBuild({
    rollup: {
      external: ['../deps.js', './deps.js'],
      clean: true,
      globbyOptions: {
        ignore: [resolve('./src/deps.ts')].map(v => v.replace(/\\/g, '/')),
      },
    },
  });

  await build({
    bundle: true,
    format: 'cjs',
    target: 'node12.20',
    entryPoints: ['src/deps.ts'],
    outdir: 'lib',
    platform: 'node',
    minify: true,
    external: ['rollup', 'fsevents', 'typescript'],
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
