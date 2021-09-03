import fsExtra from 'fs-extra';
import get from 'lodash.get';
import { resolve } from 'path';

// This function even if it's pnpm specific, it doesn't conflict with other package
// managers, since if a dependency doesn't use the workspace protocol, it does nothing
import makePublishManifestPkg from '@pnpm/exportable-manifest';

import { warn } from '../log/warn';
import { getDefault } from '../utils/getDefault';

import type { Plugin } from 'rollup';
import type { PackageBuildConfig } from './packageBuildConfig';
import { rewriteExports } from './rewrite-exports';

const makePublishManifest = getDefault(makePublishManifestPkg);

const { ensureDir, writeJSON } = fsExtra;
export interface PackageJSON extends Record<string, unknown> {
  name?: string;
  type?: string;
  main?: string;
  module?: string;
  types?: string;
  bin?: Record<string, string>;
  publishConfig?: {
    directory?: string;
  };
  files?: string[];
  buildConfig?: PackageBuildConfig;
  exports?: Record<string, string | { require?: string; import?: string }>;
}

function rewritePackageJson(pkg: PackageJSON, distDir: string, cwd: string) {
  const newPkg: PackageJSON = {};

  function withoutDistDir(str?: string) {
    return str?.replace(`${distDir}/`, '');
  }

  const fields = [
    'name',
    'version',
    'description',
    'sideEffects',
    'peerDependencies',
    'dependencies',
    'optionalDependencies',
    'repository',
    'homepage',
    'keywords',
    'author',
    'license',
    'engines',
  ];

  for (const field of fields) {
    if (pkg[field] != null) {
      newPkg[field] = pkg[field];
    }
  }

  newPkg.main = withoutDistDir(pkg.main);
  newPkg.module = withoutDistDir(pkg.module);
  newPkg.types = withoutDistDir(pkg.types) || 'index.d.ts';

  if (pkg.exports) {
    newPkg.exports = rewriteExports(pkg.exports, withoutDistDir);
  } else {
    warn(`No "." or "./*" exports field specified in ${resolve(cwd, distDir, 'package.json')}!`);
  }

  if (pkg.bin) {
    newPkg.bin = {};

    for (const [alias, binPath] of Object.entries(pkg.bin)) {
      newPkg.bin[alias] = binPath.replace(`${distDir}/`, '');
    }
  }

  return newPkg;
}

export function validatePackageJson(pkg: PackageJSON, distDir: string) {
  function expect(key: string | string[], expected: string) {
    const received = get(pkg, key);

    if (!received) throw Error(`"${key}" not specified in "${pkg.name}"`);

    if (expected !== received) {
      throw new Error(`${pkg.name}: "${Array.isArray(key) ? key.join(' ') : key}" equals "${received}", should be "${expected}"`);
    }
  }

  if (pkg.main) {
    expect('main', `${distDir}/index.js`);
    expect('module', `${distDir}/index.mjs`);
    if (get(pkg, 'types')) {
      expect('types', `${distDir}/index.d.ts`);
    } else {
      expect('typings', `${distDir}/index.d.ts`);
    }

    if (get(pkg, 'typescript.definition')) {
      expect('typescript.definition', `${distDir}/index.d.ts`);
    }
  }

  if (get(pkg, 'publishConfig')) {
    expect('publishConfig.directory', distDir);
  }

  if (get(pkg, ['exports', '.'])) {
    expect(['exports', '.', 'require'], `./${distDir}/index.js`);
    expect(['exports', '.', 'import'], `./${distDir}/index.mjs`);
  }

  if (get(pkg, ['exports', './*'])) {
    expect(['exports', './*', 'require'], `./${distDir}/*.js`);
    expect(['exports', './*', 'import'], `./${distDir}/*.mjs`);
  }
}

export async function writePackageJson({ packageJson, distDir, cwd = process.cwd() }: GeneratePackageJsonOptions) {
  const distDirPath = resolve(cwd, distDir);
  await ensureDir(distDirPath);
  await writeJSON(
    resolve(distDirPath, 'package.json'),
    await makePublishManifest(cwd, rewritePackageJson(packageJson, distDir, cwd)),
    {
      spaces: 2,
    }
  );
}

const GenPackageJson = Symbol();

declare module 'rollup' {
  interface PluginContext {
    [GenPackageJson]: Promise<void>;
  }
}

export interface GeneratePackageJsonOptions {
  packageJson: PackageJSON;
  distDir: string;
  cwd?: string;
}

export const generatePackageJson = (options: GeneratePackageJsonOptions): Plugin | null => {
  if (!options.packageJson.publishConfig?.directory) {
    if (
      !Array.isArray(options.packageJson.files) ||
      !options.packageJson.files.some(v => v === options.distDir || v === '/' + options.distDir)
    )
      throw Error(
        `No valid 'files' property in ${resolve(
          options.cwd || process.cwd(),
          'package.json'
        )} without using "publishConfig.directory"`
      );

    validatePackageJson(options.packageJson, options.distDir);

    warn(`Skipping package.json rewrite in publish subdirectory: ${resolve(options.cwd || process.cwd())}`);
    return null;
  }

  return {
    name: 'GeneratePackageJson',
    async buildStart() {
      validatePackageJson(options.packageJson, options.distDir);

      this[GenPackageJson] = writePackageJson(options);
    },
    async buildEnd() {
      await this[GenPackageJson];
    },
  };
};
