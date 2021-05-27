import { buildTsc } from "bob-esbuild";

import { Command, flags } from "@oclif/command";

export default class TSC extends Command {
  static description = "Run tsc and then copy the types";

  static flags = {
    help: flags.help({ char: "h" }),
    target: flags.string({
      multiple: true,
      required: true,
      char: "t",
    }),
  };

  async run() {
    const { flags } = this.parse(TSC);

    const startTime = Date.now();
    await buildTsc(flags.target);

    this.log(`Done in ${Date.now() - startTime}ms.`);
  }
}

export type {} from "@oclif/parser/lib/flags";
