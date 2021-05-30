import { buildTsc } from './src/tsc/build';

buildTsc().catch(err => {
  console.error(err);
  process.exit(1);
});
