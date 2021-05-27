import { cosmiconfig } from "cosmiconfig";
import fs from "fs";
import { dirname } from "path";
import { transform } from "sucrase";

import { importFromString } from "../importFromString";

import type { OutputPlugin, Plugin, RollupOptions } from "rollup";
import type { BuildTscOptions } from "../tsc/build";

export interface BobConfig {
  tsc?: BuildTscOptions;
  /**
   * @default true
   */
  clean?: boolean;
  /**
   * It defaults to bob-esbuild.config.cjs directory
   */
  rootDir?: string;

  outputPlugins?: OutputPlugin[];

  plugins?: Plugin[];

  rollupOptions?: RollupOptions;
}

export const globalConfig = cosmiconfig("bob-esbuild", {
  searchPlaces: ["bob-esbuild.config.ts"],
  loaders: {
    ".ts": async (filepath) => {
      const content = await fs.promises.readFile(filepath, "utf8");
      const { code } = transform(content, {
        filePath: filepath,
        transforms: ["imports", "typescript"],
      });
      return importFromString(code, filepath)?.config;
    },
  },
})
  .search()
  .then((result) => {
    if (!result) {
      throw Error("Config could not be found!");
    }

    const filepath = result.filepath;
    const config: BobConfig & {
      rootDir: string;
      clean: boolean;
    } = result.config;

    config.rootDir ||= dirname(filepath).replace(/\\/g, "/");
    config.clean ??= true;

    return {
      filepath,
      config,
    };
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
