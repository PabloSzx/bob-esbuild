import assert from 'assert';
import { join } from 'path';
import { parse } from 'tsconfck';
import { error } from '../log/error';
import { globalConfig } from './cosmiconfig';
import { retry } from '../utils/retry';

export const resolvedTsconfig = retry(async () => {
  const {
    config: { rootDir: configRootDir, singleBuild },
  } = await globalConfig;

  const parseResult = await parse(join(configRootDir, 'tsconfig.json'));

  const compilerOptions = parseResult.tsconfig.compilerOptions;

  assert(compilerOptions, 'compilerOptions not specified!');

  const outDir: string = compilerOptions?.outDir;

  if (typeof outDir !== 'string') throw Error('outDir not specified in ' + parseResult.tsconfigFile);

  if (!singleBuild) {
    if (compilerOptions.rootDir !== '.') throw Error("tsconfig.json rootDir has to be '.'");
  }

  return {
    outDir,
  };
}).catch(err => {
  error(err);
  process.exit(1);
});
