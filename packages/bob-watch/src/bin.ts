import { program } from 'commander';
import { StartWatcher } from '.';

declare const VERSION: string;

program
  .version(VERSION)
  .requiredOption('-c, --command <commands...>')
  .requiredOption('-w, --watch <patterns...>')
  .option('-i, --ignore <patterns...>', 'Ignore watch patterns')
  .option('--quiet', 'Prevent non-error logs', false);

program
  .parseAsync(process.argv)
  .then(({ opts }) => {
    const { watch, command, ignore, quiet } = opts<{
      watch: string[];
      command: string[];
      ignore?: string[];
      quiet?: boolean;
    }>();

    StartWatcher({
      paths: watch,
      commands: command,
      ignored: ignore,
      quiet,
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
