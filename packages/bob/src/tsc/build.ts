import assert from 'assert';
import { command } from 'execa';
import { copy, pathExists } from 'fs-extra';
import globby from 'globby';
import { parse, resolve } from 'path';

import { resolvedTsconfig } from '../config/resolveTsconfig';
import { globalConfig } from '../config/globalCosmiconfig';
import { debug } from '../log/debug';
import { error } from '../log/error';
import { getHash } from './hash';

import type { TSCOptions } from './types';

export async function buildTsc(options: TSCOptions = {}) {
  const {
    config: { tsc: globalTsc = {}, rootDir: rootDirCwd },
  } = await globalConfig;

  const startTime = Date.now();

  const hashPromise = getHash();

  const dirs = [...(options.dirs || []), ...(globalTsc.dirs || [])];

  const tscCommand = options.tscBuildCommand || globalTsc.tscBuildCommand || 'tsc --emitDeclarationOnly';

  const typesTarget = options.typesTarget || globalTsc.typesTarget || 'lib';

  assert(dirs.length, 'tsc dirs not specified!');

  const targetDirs = await globby(dirs, {
    expandDirectories: false,
    absolute: false,
    onlyDirectories: true,
    cwd: rootDirCwd,
  });

  const shouldBuild = (await hashPromise).shouldBuild;

  if (shouldBuild) {
    debug('Building types for: ' + targetDirs.join(' | '));

    await command(tscCommand, {
      cwd: rootDirCwd,
      stdio: 'inherit',
    });
  }

  const { outDir } = await resolvedTsconfig;

  await Promise.all(
    targetDirs.map(async dir => {
      const from = resolve(rootDirCwd, `${outDir}/${dir}/src`);

      if (!(await pathExists(from))) return;

      await copy(from, resolve(rootDirCwd, `${dir}/${typesTarget}`), {
        filter(src) {
          // Check if is directory
          if (!parse(src).ext) return true;

          return src.endsWith('.d.ts');
        },
      }).catch(err => {
        const errCode: string | undefined = err?.code;
        // Silence these specific error that happen when multiple processes access the same file concurrently
        switch (errCode) {
          case 'ENOENT':
          case 'EBUSY':
          case 'EPERM':
            return;
        }

        error(err);
      });
    })
  );

  debug(`Types ${shouldBuild ? 'built' : 'prepared'} in ${Date.now() - startTime}ms`);
}
