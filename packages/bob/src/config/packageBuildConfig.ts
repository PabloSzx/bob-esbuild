import { resolve } from 'path';
import { readJSON } from '../deps.js';
import type { PackageJSON } from './packageJson';

export interface PackageBuildConfig {
  input?: string[];
  copy?: string[];
  bin?: Record<
    string,
    {
      input: string;
    }
  >;
  pkg: PackageJSON;
}

export async function GetPackageBuildConfig(cwd: string = process.cwd()): Promise<PackageBuildConfig> {
  const pkg: PackageJSON = await readJSON(resolve(cwd, 'package.json'));

  if (!pkg.name) throw Error('Invalid "name" field for package.json in ' + cwd);

  const buildConfig: PackageBuildConfig = {
    pkg,
  };

  if (pkg.buildConfig?.input) {
    if (typeof pkg.buildConfig.input === 'string') {
      buildConfig.input = [pkg.buildConfig.input];
    } else if (Array.isArray(pkg.buildConfig.input) && pkg.buildConfig.input.every(v => typeof v === 'string')) {
      buildConfig.input = pkg.buildConfig.input;
    } else {
      throw Error(`Invalid buildConfig.input: ${JSON.stringify(pkg.buildConfig.input)}`);
    }
  }

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
