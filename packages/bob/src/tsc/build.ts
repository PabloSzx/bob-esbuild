import assert from "assert";
import { command } from "execa";
import { copy } from "fs-extra";
import globby from "globby";
import { parse, resolve } from "path";

import { resolvedTsconfig } from "../config";
import { globalConfig } from "../config/cosmiconfig";
import { debug } from "../log/debug";
import { error } from "../log/error";
import { getHash } from "./hash";

import type { TSCOptions } from "./types";

export async function buildTsc(options: TSCOptions = {}) {
  const {
    config: { tsc: globalTsc = {}, rootDir: cwd },
  } = await globalConfig;

  const startTime = Date.now();

  const hashPromise = getHash();

  const dirs = [...(options.dirs || []), ...(globalTsc.dirs || [])];

  const tscCommand =
    options.tscBuildCommand || globalTsc.tscBuildCommand || "tsc --emitDeclarationOnly";

  const typesTarget = options.typesTarget || globalTsc.typesTarget || "lib";

  assert(dirs.length, "tsc dirs not specified!");

  const targetDirs = await globby(dirs, {
    expandDirectories: false,
    absolute: false,
    onlyDirectories: true,
    cwd,
  });

  const shouldBuild = (await hashPromise).shouldBuild;

  if (shouldBuild) {
    debug("Building types for: " + targetDirs.join(" | "));

    await command(tscCommand, {
      cwd,
      stdio: "inherit",
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
      }).catch(error);
    })
  );

  debug(`Types ${shouldBuild ? "built" : "prepared"} in ${Date.now() - startTime}ms`);
}
