import { command } from 'execa';
import fsExtra from 'fs-extra';
import { parse, resolve } from 'path';

import { resolvedTsconfig } from '../config/tsconfig';
import { globalConfig } from '../config/cosmiconfig';
import { debug } from '../log/debug';
import { error } from '../log/error';
import { getHash } from './hash';
import { retry } from '../utils/retry';

const { copy, pathExists } = fsExtra;

import type { TSCOptions } from './types';

export async function buildTsc(options: TSCOptions = {}) {
  const {
    config: { tsc: globalTsc = {}, rootDir: rootDirCwd, distDir },
  } = await globalConfig;

  const dirs = [...(options.dirs || []), ...(globalTsc.dirs || [])];

  const startTime = Date.now();

  const { default: globby } = await import('globby');

  await retry(async () => {
    const hashPromise = Promise.allSettled([getHash()]).then(v => v[0]);

    const tscCommand = options.tscBuildCommand || globalTsc.tscBuildCommand || 'tsc --emitDeclarationOnly';

    const targetDirs = await globby(dirs, {
      expandDirectories: false,
      absolute: false,
      onlyDirectories: true,
      cwd: rootDirCwd,
    });

    const { shouldBuild, cleanHash } = await hashPromise.then(v => {
      if (v.status === 'rejected') throw v.reason;

      return v.value;
    });

    if (shouldBuild) {
      debug(!targetDirs.length ? 'No target directories for built types!' : 'Building types for: ' + targetDirs.join(' | '));

      const tsconfig = globalTsc.tsconfig;
      await command(tscCommand + (tsconfig ? ` -p ${tsconfig}` : ''), {
        cwd: rootDirCwd,
        stdio: 'inherit',
      }).catch(err => {
        cleanHash();

        throw err;
      });
    }

    const { outDir } = await resolvedTsconfig;

    await Promise.all(
      targetDirs.map(async dir => {
        const from = resolve(rootDirCwd, `${outDir}/${dir}/src`);

        if (!(await pathExists(from))) return;

        await copy(from, resolve(rootDirCwd, `${dir}/${distDir}`), {
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
  });
}
