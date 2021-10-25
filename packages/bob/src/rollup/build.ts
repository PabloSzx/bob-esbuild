import { ConfigOptions, getRollupConfig } from '../config/rollup';
import { debug } from '../log/debug';

export async function buildRollup(options?: ConfigOptions) {
  const { rollup } = await import('rollup');
  const { inputOptions, outputOptions } = await getRollupConfig(options);

  const startTime = Date.now();

  const build = await rollup(inputOptions);

  await Promise.all(
    outputOptions.map(output => {
      return build.write(output);
    })
  );

  debug(`JS built in ${Date.now() - startTime}ms`);
}
