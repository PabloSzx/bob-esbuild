import globby from "globby";
import path from "path";
import esbuild from "rollup-plugin-esbuild";
import externals from "rollup-plugin-node-externals";
import del from "rollup-plugin-delete";

import type { OutputOptions, RollupOptions, Plugin } from "rollup";

export interface ConfigOptions {
  /**
   * Clean the target directory before building
   *
   * @default true
   */
  clean?: boolean;
  /**
   * @default process.cwd()
   */
  cwd?: string;
}

export function getRollupConfig({ cwd = process.cwd(), clean }: ConfigOptions = {}) {
  const input = globby.sync(path.join(cwd, "src/**/*.ts"));

  const outputOptions: OutputOptions[] = [
    {
      dir: path.resolve(cwd, "lib"),
      format: "cjs",
      preserveModules: true,
    },
    {
      dir: path.resolve(cwd, "lib"),
      format: "es",
      entryFileNames: "[name].mjs",
      preserveModules: true,
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
  ];

  if (clean) {
    plugins.push(
      del({
        targets: ["lib/**/*.js", "lib/**/*.mjs"],
        cwd,
      })
    );
  }
  const config: RollupOptions = {
    input,
    plugins,
  };

  return { config, outputOptions };
}
