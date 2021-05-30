import { buildTsc } from 'bob-esbuild';

import { Command, flags } from '@oclif/command';

export default class TSC extends Command {
  static description = 'Run tsc and then copy the types';

  static flags = {
    help: flags.help({ char: 'h' }),
    target: flags.string({
      multiple: true,
      char: 't',
    }),
  };

  async run() {
    const { flags } = this.parse(TSC);

    await buildTsc({
      dirs: flags.target,
    });
  }
}

export type {} from '@oclif/parser/lib/flags';
