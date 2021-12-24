import { writePackageJson } from '../bob/src/config/packageJson';
import { buildTsc } from '../bob/src/tsc/build';
import pkg from './package.json';

async function main() {
  await Promise.all([
    writePackageJson({
      packageJson: pkg,
      distDir: 'lib',
    }),
    buildTsc(),
  ]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
