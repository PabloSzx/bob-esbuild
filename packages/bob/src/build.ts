import { rollup } from "rollup";

import { getRollupConfig, ConfigOptions } from "./config/rollup";
import { buildTsc } from "./tsc/build";

export async function startBuild(options?: ConfigOptions) {
  const { config, outputOptions } = await getRollupConfig(options);

  const tscBuildPromise = buildTsc();
  const build = await rollup(config);

  await Promise.all(
    outputOptions.map((output) => {
      return build.write(output);
    })
  );

  await tscBuildPromise;
}
