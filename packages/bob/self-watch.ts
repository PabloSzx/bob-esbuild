import { startWatch } from './src/watch';

startWatch().catch(err => {
  console.error(err);
  process.exit(1);
});
