import { buildRollup } from './rollup/build';
import { buildTsc } from './tsc/build';

import type { ConfigOptions } from './config/rollup';
import type { TSCOptions } from './tsc/types';

export interface BuildOptions {
  rollup?: ConfigOptions;
  tsc?: TSCOptions | false;
}

export async function startBuild(options: BuildOptions = {}) {
  await Promise.all([buildRollup(options.rollup), options.tsc !== false ? buildTsc(options.tsc) : null]);
}
