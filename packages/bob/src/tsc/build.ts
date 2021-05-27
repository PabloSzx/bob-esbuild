import assert from "assert";
import { execSync } from "child_process";
import { copy } from "fs-extra";
import globby from "globby";
import { parse, resolve } from "path";

import { resolvedTsconfig } from "../config";
import { globalConfig } from "../config/cosmiconfig";
import { getHash } from "./hash";

export interface BuildTscOptions {
  dirs?: string[];
  log?: (...message: any[]) => void;
  /**
   * @default "tsc --emitDeclarationOnly"
   */
  tscCommand?: string;
  /**
   * Target directory
   * @default "lib"
   */
  typesTarget?: string;
}

export async function buildTsc(options: BuildTscOptions = {}) {
  const {
    config: { tsc: globalTsc, rootDir: cwd },
  } = await globalConfig;

  const hashPromise = getHash();

  const dirs = [...(options.dirs || []), ...(globalTsc?.dirs || [])];

  const log = globalTsc?.log || console.log;

  const tscCommand = globalTsc?.tscCommand || "tsc --emitDeclarationOnly";

  const typesTarget = options.typesTarget || globalTsc?.typesTarget || "lib";

  assert(dirs.length, "tsc dirs not specified!");

  const targetDirs = await globby(dirs, {
    expandDirectories: false,
    absolute: false,
    onlyDirectories: true,
    cwd,
  });

  if ((await hashPromise).shouldBuild) {
    log("Building types for: " + targetDirs.join(" | "));

    execSync(tscCommand, {
      stdio: "inherit",
      cwd,
    });
  }

  const { outDir } = await resolvedTsconfig;

  await Promise.all(
    targetDirs.map(async (dir) => {
      await copy(resolve(cwd, `${outDir}/${dir}/src`), resolve(cwd, `${dir}/${typesTarget}`), {
        filter(src) {
          // Check if is directory
          if (!parse(src).ext) return true;

          return src.endsWith(".d.ts");
        },
      }).catch(console.error);
    })
  );
}
