import globby from "globby";
import path from "path";
import esbuild from "rollup-plugin-esbuild";
import externals from "rollup-plugin-node-externals";
import del from "rollup-plugin-delete";

import { globalConfig } from "./cosmiconfig";
import { debug } from "../log/debug";

import type { OutputOptions, RollupOptions, Plugin } from "rollup";

export interface ConfigOptions {
  /**
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * By default it's `true` in global config
   */
  clean?: boolean;
  /**
   * Input files
   *
   * By default it takes every ".ts" file inside src
   */
  inputFiles?: string[];
  /**
   * Enable bundling every entry point (no code-splitting available yet)
   *
   * @default false
   */
  bundle?: boolean;
}

export async function getRollupConfig(options: ConfigOptions = {}) {
  const {
    config: {
      clean: globalClean,
      outputPlugins: globalOutputPlugins,
      plugins: globalConfigPlugins,
      rollupOptions: globalRollupOptions,
      inputFiles: globalInputFiles,
      bundle: globalBundle,
    },
  } = await globalConfig;

  const cwd = options.cwd || process.cwd();

  const clean = options.clean ?? globalClean;

  const inputFiles = options.inputFiles || globalInputFiles || ["src/**/*.ts"];

  debug("Checking", inputFiles.join(" | "));

  if (!inputFiles.length) throw Error("No input files found!");

  const input = (
    await Promise.all(
      inputFiles.map((pattern) => {
        return globby(path.join(cwd, pattern).replace(/\\/g, "/"));
      })
    )
  )
    .flat()
    .filter((file, index, self) => self.indexOf(file) === index);

  if (!input.length) throw Error("No input files found!");

  debug("Building", input.join(" | "));

  const experimentalBundling = options.bundle ?? globalBundle ?? false;

  const outputOptions: OutputOptions[] = [
    {
      dir: path.resolve(cwd, "lib"),
      format: "cjs",
      preserveModules: true,
      exports: "auto",
      plugins: globalOutputPlugins,
      sourcemap: true,
    },
    {
      dir: path.resolve(cwd, "lib"),
      format: "es",
      entryFileNames: "[name].mjs",
      preserveModules: true,
      plugins: globalOutputPlugins,
      sourcemap: true,
    },
  ];

  const plugins: Plugin[] = [
    esbuild({
      target: "es2019",
      sourceMap: true,
      experimentalBundling,
    }),
    externals({
      packagePath: path.resolve(cwd, "package.json"),
      deps: true,
    }),
    ...(globalConfigPlugins || []),
  ];

  if (clean) {
    plugins.push(
      del({
        targets: ["lib/**/*.js", "lib/**/*.mjs", "lib/**/*.map"],
        cwd,
      })
    );
  }
  const rollupConfig: RollupOptions = {
    input,
    plugins,
    ...globalRollupOptions,
  };

  return { config: rollupConfig, outputOptions };
}
