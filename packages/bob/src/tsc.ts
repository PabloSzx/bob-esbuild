import { execSync } from "child_process";
import { copy } from "fs-extra";

export async function buildTsc(dirs: string[]) {
  execSync("tsc", {
    stdio: "inherit",
  });

  await Promise.all(
    dirs.map(async (dir) => {
      await copy(`dist/${dir}/src`, `${dir}/dist`);
    })
  );
}
