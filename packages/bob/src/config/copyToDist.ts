import fsExtra from 'fs-extra';

import { dirname, join } from 'path';

import type { Plugin } from 'rollup';

const { copyFile, mkdirp, pathExists } = fsExtra;

export interface CopyFilesOptions {
  distDir: string;
  files: string[];
  cwd?: string;
}

async function copyFilesToDist({ cwd = process.cwd(), distDir, files }: CopyFilesOptions) {
  const { default: globby } = await import('globby');

  const allFiles = await globby(files, { cwd });

  await Promise.all(
    allFiles.map(async file => {
      const sourcePath = join(cwd, file);

      if (await pathExists(sourcePath)) {
        const destPath = join(cwd, distDir, file.replace(/\.\.\//g, ''));
        await mkdirp(dirname(destPath));

        await copyFile(sourcePath, destPath);
      }
    })
  );
}

export const copyToDist = (options: CopyFilesOptions): Plugin => {
  const pending: Promise<PromiseSettledResult<void>>[] = [];

  return {
    name: 'CopyToDist',
    buildStart() {
      pending.push(Promise.allSettled([copyFilesToDist(options)]).then(v => v[0]));
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
