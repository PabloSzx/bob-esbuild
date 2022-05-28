import { program, StartWatcher } from './index';

declare const VERSION: string;

program
  .version(VERSION)
  .requiredOption('-c, --command <commands...>', 'Commands to be executed on start and on every change')
  .requiredOption('-w, --watch <patterns...>', 'Patterns of directories or files to be watched')
  .option('-i, --ignore <patterns...>', 'Ignore watch patterns')
  .option('--quiet', 'Prevent non-error logs', false);

const { watch, command, ignore, quiet } = program.parse(process.argv).opts<{
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
