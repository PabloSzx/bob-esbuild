import { startBuild } from "./src/build";
import { error } from "./src/log/error";

startBuild().catch((err) => {
  error(err);
  process.exit(1);
});
