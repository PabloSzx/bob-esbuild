import { buildCode } from '../bob-ts/src/build';
import { buildTsc } from '../bob/src/tsc/build';
import pkg from './package.json';

async function main() {
  await buildCode({
    entryPoints: ['./src/require.ts'],
    clean: true,
    format: 'cjs',
    outDir: 'lib',
    target: 'node13.2',
    esbuild: {
      define: {
        VERSION: JSON.stringify(pkg.version),
      },
      minify: false,
    },
    sourcemap: false,
  });

  await buildCode({
    entryPoints: ['./src/loader.ts', './src/bin.ts'],
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
  });

  await buildTsc();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
