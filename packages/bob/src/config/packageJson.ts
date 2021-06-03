import { ensureDir, readJSON, writeJSON } from 'fs-extra';
import get from 'lodash.get';
import { resolve } from 'path';

import { debug } from '../log/debug';

import type { Plugin } from 'rollup';
import type { PackageBuildConfig } from './packageBuildConfig';

export interface PackageJSON extends Record<string, unknown> {
  bin?: Record<string, string>;
  publishConfig?: {
    directory?: string;
  };
  files?: string[];
  buildConfig?: PackageBuildConfig;
}

export function readPackageJson(): Promise<PackageJSON> {
  return readJSON(resolve(process.cwd(), 'package.json'));
}

function rewritePackageJson(pkg: PackageJSON, distDir: string) {
  const newPkg: PackageJSON = {};
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

  if (pkg.main) {
    newPkg.main = 'index.js';
    newPkg.module = 'index.mjs';
    newPkg.types = 'index.d.ts';
    newPkg.typescript = {
      definition: 'index.d.ts',
    };
  }

  newPkg.exports = {
    '.': {
      require: './index.js',
      import: './index.mjs',
    },
    './*': {
      require: './*.js',
      import: './*.mjs',
    },
  };

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
  await writeJSON(resolve(distDirPath, 'package.json'), rewritePackageJson(packageJson, distDir), {
    spaces: 2,
  });
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

export const generatePackageJson = (options: GeneratePackageJsonOptions): Plugin => {
  return {
    name: 'GeneratePackageJson',
    async buildStart() {
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

        debug(`Skipping package.json rewrite in publish subdirectory: ${resolve(options.cwd || process.cwd())}`);
        return;
      }

      validatePackageJson(options.packageJson, options.distDir);

      this[GenPackageJson] = writePackageJson(options);
    },
    async buildEnd() {
      await this[GenPackageJson];
    },
  };
};
