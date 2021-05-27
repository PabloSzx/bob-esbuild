import { startBuild } from "./src/build";

startBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
