import { buildRollup } from "./rollup/build";
import { buildTsc } from "./tsc/build";

import type { ConfigOptions } from "./config";
import type { TSCOptions } from "./tsc/types";

export interface BuildOptions {
  rollup?: ConfigOptions;
  tsc?: TSCOptions;
}

export async function startBuild(options: BuildOptions = {}) {
  await Promise.all([buildRollup(options.rollup), buildTsc(options.tsc)]);
}
