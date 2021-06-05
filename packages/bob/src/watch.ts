import { error } from './log/error';
import { watchRollup, WatchRollupOptions } from './rollup/watch';
import { buildTsc } from './tsc/build';

import type { TSCOptions } from './tsc/types';

export interface WatchOptions {
  rollup?: WatchRollupOptions;
  tsc?: TSCOptions | false;
}

export function startWatch(options: WatchOptions = {}) {
  return watchRollup({
    ...options.rollup,
    onSuccessCallback(builds) {
      // Only for the first build we wait until it ends
      if (options.tsc !== false && builds === 0) {
        buildTsc(options.tsc).catch(error);
      }
    },
    onStartCallback(builds) {
      // For subsequent builds we start building types on start
      if (options.tsc !== false && builds > 0) {
        buildTsc(options.tsc).catch(error);
      }
    },
  });
}

export type {} from 'rollup';
