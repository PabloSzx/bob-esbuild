import globby from "globby";
import path from "path";
import esbuild from "rollup-plugin-esbuild";
import externals from "rollup-plugin-node-externals";

import type { OutputOptions, RollupOptions } from "rollup";

export function getConfig(cwd: string = process.cwd()) {
  const input = globby.sync(path.join(cwd, "src/**/*.ts"));

  const outputOptions: OutputOptions[] = [
    {
      dir: path.resolve(cwd, "dist"),
      format: "cjs",
      preserveModules: true,
    },
    {
      dir: path.resolve(cwd, "dist"),
      format: "es",
      entryFileNames: "[name].mjs",
      preserveModules: true,
    },
  ];
  const config: RollupOptions = {
    input,
    plugins: [
      esbuild({
        target: "es2019",
        sourceMap: true,
      }),
      externals({
        packagePath: path.resolve(cwd, "package.json"),
        deps: true,
      }),
    ],
  };

  return { config, outputOptions };
}
