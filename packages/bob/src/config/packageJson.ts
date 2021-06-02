import get from 'lodash.get';
import { readJSON, writeJSON } from 'fs-extra';
import { resolve } from 'path';

import type { Plugin } from 'rollup';

export function readPackageJson(): Promise<Record<string, any>> {
  return readJSON(resolve(process.cwd(), 'package.json'));
}

function rewritePackageJson(pkg: Record<string, any>, distDir: string) {
  const newPkg: Record<string, any> = {};
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

  newPkg.main = 'index.js';
  newPkg.module = 'index.mjs';
  newPkg.types = 'index.d.ts';
  newPkg.typescript = {
    definition: 'index.d.ts',
  };

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

    for (const alias in pkg.bin) {
      newPkg.bin[alias] = pkg.bin[alias].replace(`${distDir}/`, '');
    }
  }

  return newPkg;
}

export function validatePackageJson(pkg: Record<string, unknown>, distDir: string) {
  function expect(key: string | string[], expected: string) {
    const received = get(pkg, key);

    if (!received) throw Error(`"${key}" not specified in "${pkg.name}"`);

    if (expected !== received) {
      throw new Error(`${pkg.name}: "${Array.isArray(key) ? key.join(' ') : key}" equals "${received}", should be "${expected}"`);
    }
  }

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

  if (get(pkg, 'publishConfig')) {
    expect('publishConfig.directory', distDir);
  }

  expect(['exports', '.', 'require'], `./${distDir}/index.js`);
  expect(['exports', '.', 'import'], `./${distDir}/index.mjs`);
}

export async function writePackageJson(pkg: Record<string, any>, distDir: string) {
  await writeJSON(resolve(process.cwd(), distDir, 'package.json'), rewritePackageJson(pkg, distDir), {
    spaces: 2,
  });
}

const GenPackageJson = Symbol();

declare module 'rollup' {
  interface PluginContext {
    [GenPackageJson]: Promise<void>;
  }
}

export const generatePackageJson = (packageJson: Record<string, any>, distDir: string): Plugin => {
  return {
    name: 'GeneratePackageJson',
    async buildStart() {
      validatePackageJson(packageJson, distDir);

      this[GenPackageJson] = writePackageJson(packageJson, distDir);
    },
    async buildEnd() {
      await this[GenPackageJson];
    },
  };
};
