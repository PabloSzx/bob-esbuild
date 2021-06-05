import { globalConfig } from './config';
import { buildRollup } from './rollup/build';
import { buildTsc } from './tsc/build';

import type { ConfigOptions } from './config/rollup';
import type { TSCOptions } from './tsc/types';

export interface BuildOptions {
  rollup?: ConfigOptions;
  tsc?: TSCOptions | false;
}

export async function startBuild(options: BuildOptions = {}) {
  const skipTsc = options.tsc !== false ? (await globalConfig).config.skipAutoTSCBuild : true;

  await Promise.all([buildRollup(options.rollup), skipTsc ? null : buildTsc({ ...options.tsc })]);
}
