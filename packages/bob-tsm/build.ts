import { buildCode } from '../bob-ts/src/build';
import pkg from './package.json';

await buildCode({
  entryPoints: ['./src/require.ts', './src/bin.ts'],
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
  entryPoints: ['./src/loader.ts'],
  clean: false,
  format: 'esm',
  outDir: 'lib',
  target: 'node13.2',
  esbuild: {
    minify: false,
  },
  sourcemap: false,
});
