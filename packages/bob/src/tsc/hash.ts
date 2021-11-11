import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { globalConfig } from '../config/cosmiconfig';
import { resolvedTsconfig } from '../config/tsconfig';
import { hashElement, mkdirp, readJSON, writeJSON } from '../deps.js';
import { retry } from '../utils/retry';

export async function getHash(): Promise<{
  shouldBuild: boolean;
  cleanHash: () => void;
}> {
  const {
    config: { rootDir, distDir, tsc: { hash } = {}, singleBuild },
  } = await globalConfig;
  const { outDir } = await resolvedTsconfig;

  // For single build, always build typescript
  if (singleBuild) {
    return {
      cleanHash() {},
      shouldBuild: true,
    };
  }

  const typesHashJSON = resolve(rootDir, outDir, 'types-hash.json');

  const [currentHash, jsonHash] = await retry(async () =>
    Promise.all([
      hashElement(rootDir, {
        files: {
          exclude: hash?.files?.exclude || ['*.d.ts'],
          include: hash?.files?.include || ['*.ts', '*.tsx', '*.json'],
        },
        folders: {
          exclude: [
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
            ...(hash?.folders?.exclude || []),
          ],
        },
      }),
      existsSync(typesHashJSON)
        ? readJSON(typesHashJSON).then(
            v => v as { hash: string },
            () => null
          )
        : null,
    ])
  );

  const cleanHash = () => {
    try {
      unlinkSync(typesHashJSON);
    } catch (err) {}
  };

  if (jsonHash?.hash !== currentHash.hash) {
    mkdirp(resolve(rootDir, outDir)).then(
      () => {
        writeJSON(typesHashJSON, {
          hash: currentHash.hash,
        }).catch(() => null);
      },
      () => null
    );

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
