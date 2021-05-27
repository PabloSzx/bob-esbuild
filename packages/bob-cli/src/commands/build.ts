import { startBuild } from "bob-esbuild";

import { Command, flags } from "@oclif/command";

export default class Build extends Command {
  static description = "Build using rollup+esbuild";

  static flags = {
    help: flags.help({ char: "h" }),
    cwd: flags.string({
      description: "Change target current directory",
    }),
  };

  async run() {
    const {
      flags: { cwd },
    } = this.parse(Build);

    const startTime = Date.now();

    await startBuild({ cwd });

    this.log(`Done in ${Date.now() - startTime}ms.`);
  }
}

export type {} from "@oclif/parser/lib/flags";
