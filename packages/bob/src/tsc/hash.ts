import { hashElement } from "folder-hash";
import fsExtra from "fs-extra";
import { existsSync, mkdir } from "fs";
import { resolve } from "path";

import { globalConfig } from "../config/cosmiconfig";
import { resolvedTsconfig } from "../config/resolveTsconfig";

export async function getHash(): Promise<{
  shouldBuild?: boolean;
}> {
  const {
    config: { rootDir },
  } = await globalConfig;
  const { outDir } = await resolvedTsconfig;

  const typesHashJSON = resolve(rootDir, outDir, "types-hash.json");

  const [currentHash, jsonHash] = await Promise.all([
    hashElement(rootDir, {
      files: {
        exclude: ["*.d.ts"],
        include: ["*.ts", "*.json"],
      },
      folders: {
        exclude: ["node_modules", "lib", "temp", "dist", ".git", outDir],
      },
    }),
    existsSync(typesHashJSON)
      ? fsExtra.readJSON(typesHashJSON).then(
          (v) => v as { hash: string },
          () => null
        )
      : null,
  ]);

  if (jsonHash?.hash !== currentHash.hash) {
    mkdir(resolve(rootDir, outDir), () => {
      fsExtra
        .writeJSON(typesHashJSON, {
          hash: currentHash.hash,
        })
        .catch(console.error);
    });

    return {
      shouldBuild: true,
    };
  }
  return {
    shouldBuild: false,
  };
}
