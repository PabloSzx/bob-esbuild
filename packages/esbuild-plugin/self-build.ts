import { buildTsc } from '../bob/src/tsc/build';

buildTsc().catch(err => {
  console.error(err);
  process.exit(1);
});
