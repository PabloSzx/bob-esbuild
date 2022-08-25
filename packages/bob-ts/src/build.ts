import type { RollupConfig } from './rollupConfig';
import { getRollupConfig } from './rollupConfig';

export async function buildCode(config: RollupConfig) {
  const { rollup } = await import('rollup');
  const { inputOptions, outputOptions, input } = await getRollupConfig(config);

  const build = await rollup(inputOptions);

  const result = await Promise.all(
    outputOptions.map(output => {
      return build.write(output);
    })
  );

  return {
    result,
    inputOptions,
    outputOptions,
    input,
  };
}
