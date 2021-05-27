import { rollup } from "rollup";

import { getRollupConfig, ConfigOptions } from "./config";

export async function startBuild(options?: ConfigOptions) {
  const { config, outputOptions } = await getRollupConfig(options);

  const build = await rollup(config);

  await Promise.all(
    outputOptions.map((output) => {
      return build.write(output);
    })
  );
}
