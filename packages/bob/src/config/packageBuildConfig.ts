import { readJSON } from 'fs-extra';
import { resolve } from 'path';

import type { OutputOptions } from 'rollup';
import type { PackageJSON } from './packageJson';

export interface PackageBuildConfig {
  copy?: string[];
  bin?: Record<
    string,
    {
      input: string;
      /**
       * @default "inline"
       */
      sourcemap?: OutputOptions['sourcemap'];
    }
  >;
  pkg: PackageJSON;
}

export async function GetPackageBuildConfig(cwd: string = process.cwd()): Promise<PackageBuildConfig> {
  const pkg: PackageJSON = await readJSON(resolve(cwd, 'package.json'));

  const buildConfig: PackageBuildConfig = {
    pkg,
  };

  if (Array.isArray(pkg.buildConfig?.copy)) {
    buildConfig.copy = pkg.buildConfig?.copy;
  }

  if (pkg.buildConfig?.bin && typeof pkg.buildConfig.bin === 'object') {
    buildConfig.bin = pkg.buildConfig.bin;
  }

  return {
    ...buildConfig,
    pkg,
  };
}
