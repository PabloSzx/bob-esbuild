import fsExtra from 'fs-extra';

import { dirname, join } from 'path';

import type { Plugin } from 'rollup';

const { copyFile, mkdirp, pathExists } = fsExtra;

const CopyToDist = Symbol();

declare module 'rollup' {
  interface PluginContext {
    [CopyToDist]: Promise<void>;
  }
}

export interface CopyFilesOptions {
  distDir: string;
  files: string[];
  cwd?: string;
}

async function copyFilesToDist({ cwd = process.cwd(), distDir, files }: CopyFilesOptions) {
  const { globby } = await import('globby');

  const allFiles = await globby(files, { cwd });

  await Promise.all(
    allFiles.map(async file => {
      const sourcePath = join(cwd, file);

      if (await pathExists(sourcePath)) {
        const destPath = join(cwd, distDir, file);
        await mkdirp(dirname(destPath));

        await copyFile(sourcePath, destPath);
      }
    })
  );
}

export const copyToDist = (options: CopyFilesOptions): Plugin => {
  return {
    name: 'CopyToDist',
    buildStart() {
      this[CopyToDist] = copyFilesToDist(options);
    },
    async buildEnd() {
      await this[CopyToDist];
    },
  };
};
