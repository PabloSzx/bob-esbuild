import { resolve } from 'path';
import type { Plugin } from 'rollup';
import { ensureDir, get, writeJSON, makePublishManifest } from '../deps.js';
import { warn } from '../log/warn';
import type { ResolvedBobConfig } from './cosmiconfig';
import { rewriteExports } from './rewrite-exports';
import type { ProjectManifest } from '@pnpm/types';
import type { PackageBuildConfig } from './packageBuildConfig';

export interface PackageJSON extends ProjectManifest, Record<string, unknown> {
  files?: string[];
  type?: string;
  exports?: Record<string, string | { require?: string; import?: string }>;
  buildConfig?: PackageBuildConfig;
}

export const getPackageJsonName = (pkg: PackageJSON): string => {
  if ('name' in pkg && pkg.name) return pkg.name;

  throw Error('Invalid package.json without name: ' + JSON.stringify(pkg));
};

export function rewritePackageJson(pkg: PackageJSON, distDir: string, cwd: string = process.cwd()) {
  const newPkg: PackageJSON = {
    name: pkg.name,
  };

  function withoutDistDir(str?: string) {
    return str?.replace(`${distDir}/`, '');
  }

  const fields = [
    'name',
    'version',
    'description',
    'sideEffects',
    'peerDependencies',
    'peerDependenciesMeta',
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
      newPkg.bin[alias] = withoutDistDir(binPath)!;
    }
  }

  return newPkg;
}

export function validatePackageJson(pkg: PackageJSON, distDir: string) {
  const typeModule = pkg.type === 'module';

  function expect(key: string | string[], expected: string | undefined) {
    const received = get(pkg, key);

    if (!received) throw Error(`"${key}" not specified in "${pkg.name}"`);

    if (expected !== received) {
      throw new Error(`${pkg.name}: "${Array.isArray(key) ? key.join(' ') : key}" equals "${received}", should be "${expected}"`);
    }
  }

  if (pkg.main) {
    expect('main', `${distDir}/index.js`);

    if (typeModule) {
      expect('module', undefined);
    } else {
      expect('module', `${distDir}/index.mjs`);
    }

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
    if (get(pkg, ['exports', '.', 'require']))
      expect(['exports', '.', 'require'], typeModule ? `./${distDir}/index.cjs` : `./${distDir}/index.js`);
    if (get(pkg, ['exports', '.', 'import']))
      expect(['exports', '.', 'import'], typeModule ? `./${distDir}/index.js` : `./${distDir}/index.mjs`);
  }

  if (get(pkg, ['exports', './*'])) {
    if (get(pkg, ['exports', './*', 'require']))
      expect(['exports', './*', 'require'], typeModule ? `./${distDir}/*.cjs` : `./${distDir}/*.js`);

    if (get(pkg, ['exports', './*', 'import']))
      expect(['exports', './*', 'import'], typeModule ? `./${distDir}/*.js` : `./${distDir}/*.mjs`);
  }
}

export async function writePackageJson({
  packageJson,
  distDir,
  cwd = process.cwd(),
  rewritePackage,
}: GeneratePackageJsonOptions) {
  const distDirPath = resolve(cwd, distDir);
  await ensureDir(distDirPath);

  const pkg = (await makePublishManifest(cwd, rewritePackageJson(packageJson, distDir, cwd))) as PackageJSON;

  await writeJSON(resolve(distDirPath, 'package.json'), rewritePackage ? await rewritePackage(pkg) : pkg, {
    spaces: 2,
  });
}

export interface GeneratePackageJsonOptions {
  packageJson: PackageJSON;
  distDir: string;
  cwd?: string;
  skipValidate?: boolean;
  rewritePackage?: (pkg: PackageJSON) => Promise<PackageJSON> | PackageJSON;
}

export const generatePackageJson = (options: GeneratePackageJsonOptions, config: ResolvedBobConfig): Plugin | null => {
  const manualRewrite = config.manualRewritePackageJson?.[getPackageJsonName(options.packageJson)];

  if (!options.packageJson.publishConfig?.directory) {
    if (manualRewrite) {
      throw Error(
        `manualRewritePackageJson can only be specified if publishConfig.directory is not specified for ${options.packageJson.name}`
      );
    }

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

  const pending: Promise<PromiseSettledResult<void>>[] = [];

  return {
    name: 'GeneratePackageJson',
    async buildStart() {
      if (!manualRewrite && !options.skipValidate) validatePackageJson(options.packageJson, options.distDir);

      pending.push(
        Promise.allSettled([
          writePackageJson(manualRewrite ? { ...options, packageJson: await manualRewrite(options.packageJson) } : options),
        ]).then(v => v[0])
      );
    },
    async buildEnd() {
      await Promise.all(
        pending.map(v =>
          v.then(v => {
            if (v.status === 'rejected') throw v.reason;
          })
        )
      );
    },
  };
};
