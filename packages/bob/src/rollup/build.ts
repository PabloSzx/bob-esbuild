import { rollup } from 'rollup';

import { ConfigOptions, getRollupConfig } from '../config/rollupConfig';
import { debug } from '../log/debug';

export async function buildRollup(options?: ConfigOptions) {
  const { config, outputOptions } = await getRollupConfig(options);

  const startTime = Date.now();

  const build = await rollup(config);

  await Promise.all(
    outputOptions.map(output => {
      return build.write(output);
    })
  );

  debug(`JS built in ${Date.now() - startTime}ms`);
}
