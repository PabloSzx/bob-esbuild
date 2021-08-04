import { program } from 'commander';

import { BuildCommand, TSCCommand, WatchCommand } from './commands';

program.addCommand(BuildCommand).addCommand(TSCCommand).addCommand(WatchCommand);

program
  .parseAsync(process.argv)
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
