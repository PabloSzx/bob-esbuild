import { startBuild } from "bob-esbuild";

import { Command, flags } from "@oclif/command";

export default class TSC extends Command {
  static description = "Build using rollup+esbuild";

  static flags = {
    help: flags.help({ char: "h" }),
  };

  async run() {
    const startTime = Date.now();

    await startBuild();

    this.log(`Done in ${Date.now() - startTime}ms.`);
  }
}

export type {} from "@oclif/parser/lib/flags";
