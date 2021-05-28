import { rollup } from "rollup";

import { ConfigOptions, getRollupConfig } from "./config/rollup";
import { debug } from "./log/debug";
import { buildTsc } from "./tsc/build";

export async function startBuild(options?: ConfigOptions) {
  const { config, outputOptions } = await getRollupConfig(options);

  const startTime = Date.now();

  const tscBuildPromise = buildTsc();
  const build = await rollup(config);

  await Promise.all(
    outputOptions.map((output) => {
      return build.write(output);
    })
  );

  debug(`JS built in ${Date.now() - startTime}ms.`);

  await tscBuildPromise;
}
