import { readJSON } from 'fs-extra';
import { resolve } from 'path';

export interface PackageBuildConfig {
  copy?: string[];
  bin?: Record<string, { input: string; sourcemap?: boolean }>;
}

export async function GetPackageBuildConfig(cwd: string = process.cwd()) {
  const pkg: Record<string, unknown> & {
    buildConfig?: PackageBuildConfig;
  } = await readJSON(resolve(cwd, 'package.json'));

  const buildConfig: PackageBuildConfig = {};

  if (Array.isArray(pkg.buildConfig?.copy)) {
    buildConfig.copy = pkg.buildConfig?.copy;
  }

  if (pkg.buildConfig?.bin && typeof pkg.buildConfig.bin === 'object') {
    buildConfig.bin = pkg.buildConfig.bin;
  }

  return {
    buildConfig,
    pkg,
  };
}
