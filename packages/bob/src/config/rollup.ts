import globby from "globby";
import path from "path";
import esbuild from "rollup-plugin-esbuild";
import externals from "rollup-plugin-node-externals";
import del from "rollup-plugin-delete";

import { globalConfig } from "./cosmiconfig";

import type { OutputOptions, RollupOptions, Plugin } from "rollup";

export interface ConfigOptions {
  /**
   * @default process.cwd()
   */
  cwd?: string;
  clean?: boolean;
}

export async function getRollupConfig(options: ConfigOptions = {}) {
  const {
    config: {
      clean: globalClean,
      outputPlugins: globalOutputPlugins,
      plugins: globalConfigPlugins,
      rollupOptions: globalRollupOptions,
    },
  } = await globalConfig;

  const cwd = options.cwd || process.cwd();

  const clean = options.clean ?? globalClean;

  const input = await globby(path.join(cwd, "src/**/*.ts").replace(/\\/g, "/"));

  const outputOptions: OutputOptions[] = [
    {
      dir: path.resolve(cwd, "lib"),
      format: "cjs",
      preserveModules: true,
      exports: "auto",
      plugins: globalOutputPlugins,
    },
    {
      dir: path.resolve(cwd, "lib"),
      format: "es",
      entryFileNames: "[name].mjs",
      preserveModules: true,
      plugins: globalOutputPlugins,
    },
  ];

  const plugins: Plugin[] = [
    esbuild({
      target: "es2019",
      sourceMap: true,
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
        targets: ["lib/**/*.js", "lib/**/*.mjs"],
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
