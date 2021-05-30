import { startBuild } from '../bob/src/build';

startBuild().catch(err => {
  console.error(err);
  process.exit(1);
});
