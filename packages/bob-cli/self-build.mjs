import { startBuild } from "bob-esbuild";

startBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
