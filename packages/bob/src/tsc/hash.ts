import { hashElement } from 'folder-hash';
import { existsSync, mkdir, rmSync } from 'fs';
import fsExtra from 'fs-extra';
import { resolve } from 'path';

import { globalConfig } from '../config/cosmiconfig';
import { resolvedTsconfig } from '../config/tsconfig';
import { error } from '../log/error';

export async function getHash() {
  const {
    config: { rootDir, distDir, tsc: { hash } = {} },
  } = await globalConfig;
  const { outDir } = await resolvedTsconfig;

  const typesHashJSON = resolve(rootDir, outDir, 'types-hash.json');

  const [currentHash, jsonHash] = await Promise.all([
    hashElement(rootDir, {
      files: {
        exclude: hash?.files?.exclude || ['*.d.ts'],
        include: hash?.files?.include || ['*.ts', '*.tsx', '*.json'],
      },
      folders: {
        exclude: hash?.folders?.exclude || [
          outDir,
          distDir,
          'node_modules',
          'lib',
          'temp',
          'dist',
          '.git',
          '.next',
          'coverage',
          '.vscode',
          '.github',
          '.changeset',
          '.husky',
          '.bob',
        ],
      },
    }),
    existsSync(typesHashJSON)
      ? fsExtra.readJSON(typesHashJSON).then(
          v => v as { hash: string },
          () => null
        )
      : null,
  ]);

  const cleanHash = () => {
    try {
      rmSync(typesHashJSON);
    } catch (err) {
      console.error(err);
    }
  };

  if (jsonHash?.hash !== currentHash.hash) {
    mkdir(resolve(rootDir, outDir), () => {
      fsExtra
        .writeJSON(typesHashJSON, {
          hash: currentHash.hash,
        })
        .catch(error);
    });

    return {
      shouldBuild: true,
      cleanHash,
    };
  }
  return {
    shouldBuild: false,
    cleanHash,
  };
}
