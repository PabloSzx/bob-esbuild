import { cosmiconfig } from "cosmiconfig";
import fs from "fs";
import { dirname } from "path";
import { transform } from "sucrase";

import { importFromString } from "../importFromString";
import { error } from "../log/error";

import type { OutputPlugin, Plugin, RollupOptions } from "rollup";
import type { BuildTscOptions } from "../tsc/build";
import type { ConfigOptions } from "./rollup";

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface BobConfig extends Pick<ConfigOptions, "clean" | "inputFiles" | "bundle"> {
  tsc?: BuildTscOptions;
  /**
   * It defaults to bob-esbuild.config directory
   */
  rootDir?: string;

  outputPlugins?: OutputPlugin[];

  plugins?: Plugin[];

  rollupOptions?: RollupOptions;

  /**
   * Enabled debugging logs
   */
  verbose?: boolean;
}

export type ResolvedBobConfig = PickRequired<BobConfig, "rootDir" | "clean">;

export interface CosmiConfigResult {
  filepath: string;
  config: ResolvedBobConfig;
}

export const globalConfig: Promise<CosmiConfigResult> & {
  current?: CosmiConfigResult;
} = cosmiconfig("bob-esbuild", {
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
  .then((result): CosmiConfigResult => {
    if (!result) throw Error("Config could not be found!");

    const filepath = result.filepath;
    const config: ResolvedBobConfig = result.config;

    config.rootDir = config.rootDir || dirname(filepath).replace(/\\/g, "/");
    config.clean = config.clean ?? true;

    const data = {
      filepath,
      config,
    };

    globalConfig.current = data;

    return data;
  })
  .catch((err) => {
    error(err);
    process.exit(1);
  });
