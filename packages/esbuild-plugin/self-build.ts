import { promises } from 'fs';
import { rewritePackageJson } from '../bob/src/config/packageJson';
import { buildTsc } from '../bob/src/tsc/build';
import pkg from './package.json';

async function main() {
  await Promise.all([
    promises.writeFile('./lib/package.json', JSON.stringify(rewritePackageJson(pkg, 'lib', process.cwd()), null, 2), 'utf8'),
    buildTsc(),
  ]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
