import assert from 'assert';
import { load } from 'tsconfig';

import { error } from '../log/error';
import { globalConfig } from './cosmiconfig';

export const resolvedTsconfig = (async () => {
  const {
    config: { rootDir: configRootDir, singleBuild },
  } = await globalConfig;

  const { config, path } = await load(configRootDir);

  if (!path) throw Error('tsconfig could not be found at the root!');

  const compilerOptions = config?.compilerOptions;

  assert(compilerOptions, 'compilerOptions not specified!');

  const outDir: string = compilerOptions?.outDir;

  if (typeof outDir !== 'string') throw Error('outDir not specified in ' + path);

  if (!singleBuild) {
    if (compilerOptions.rootDir !== '.') throw Error("tsconfig.json rootDir has to be '.'");
  }

  return {
    outDir,
  };
})().catch(err => {
  error(err);
  process.exit(1);
});
