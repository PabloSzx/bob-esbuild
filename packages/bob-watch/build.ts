import { buildCode } from '../bob-ts/src/build';
import pkg from './package.json';

async function main() {
  await buildCode({
    entryPoints: ['./src'],
    clean: true,
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
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
