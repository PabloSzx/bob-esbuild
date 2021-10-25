import type { RollupConfig } from './rollupConfig';
import { getRollupConfig } from './rollupConfig';

export async function buildCode(config: RollupConfig) {
  const { rollup } = await import('rollup');
  const { inputOptions, outputOptions } = await getRollupConfig(config);

  const build = await rollup(inputOptions);

  await Promise.all(
    outputOptions.map(output => {
      return build.write(output);
    })
  );
}
