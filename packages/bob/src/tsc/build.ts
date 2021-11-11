import { parse, resolve } from 'path';
import { globalConfig } from '../config/cosmiconfig';
import { resolvedTsconfig } from '../config/tsconfig';
import { command, copy, pathExists, globby } from '../deps.js';
import { debug } from '../log/debug';
import { warn } from '../log/warn';
import { retry } from '../utils/retry';
import { getHash } from './hash';
import type { TSCOptions } from './types';

export async function buildTsc(options: TSCOptions = {}) {
  const {
    config: { tsc: globalTsc = {}, rootDir: rootDirCwd, distDir },
  } = await globalConfig;

  const dirs = [...(options.dirs || []), ...(globalTsc.dirs || [])];

  const startTime = Date.now();

  const hashPromise = Promise.allSettled([retry(getHash)]).then(v => v[0]);

  const tscCommand = options.tscBuildCommand || globalTsc.tscBuildCommand || 'tsc --emitDeclarationOnly';

  const targetDirs = await retry(() => {
    return globby(dirs, {
      expandDirectories: false,
      absolute: false,
      onlyDirectories: true,
      cwd: rootDirCwd,
    });
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

  const cwd = options.cwd ? resolve(options.cwd) : process.cwd();

  if (cwd.replace(/\\/g, '/') === rootDirCwd) return;

  const targetDir = targetDirs.find(v => resolve(rootDirCwd, v) === cwd);

  if (!targetDir) {
    warn(`Current directory: "${cwd}" not getting typescript definitions`);

    return;
  }

  const from = resolve(rootDirCwd, outDir, targetDir, 'src');

  if (!(await pathExists(from))) return;

  await retry(
    async () =>
      await copy(from, resolve(rootDirCwd, targetDir, distDir), {
        filter(src) {
          // Check if is directory
          if (!parse(src).ext) return true;

          return src.endsWith('.d.ts');
        },
      }),
    10
  );

  debug(`Types ${shouldBuild ? 'built' : 'prepared'} in ${Date.now() - startTime}ms`);
}
