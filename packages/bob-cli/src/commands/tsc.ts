import { buildTsc } from 'bob-esbuild';

import { Command } from 'commander';

export const TSCCommand = new Command('tsc')
  .description('Run tsc and then copy the types')
  .option('-t --target <...dirs>')
  .action(async ({ target }) => {
    await buildTsc({
      dirs: target,
    });
  });
