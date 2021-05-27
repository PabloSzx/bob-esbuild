import { rollup } from "rollup";

import { getConfig } from "./config";

export async function startBuild() {
  const { config, outputOptions } = getConfig();

  const build = await rollup(config);

  await Promise.all(
    outputOptions.map((output) => {
      return build.write(output);
    })
  );
}
