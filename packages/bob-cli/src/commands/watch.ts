import { startWatch } from 'bob-esbuild/watch';

import { Command } from 'commander';

export const WatchCommand = new Command('watch').description(
  'Watch using rollup+esbuild, all these flags override the bob-esbuild.config'
);

WatchCommand.option('--cwd <dir>', 'Change target current directory')
  .option('-i --input <file...>', "Input pattern files, if not specified, it reads '**/*.ts'")
  .option('--bundle', 'Enable bundling every entry point (With no support for code-splitting)')
  .option(
    '--clean',
    "DEFAULT=false. Clean the output files before writing the new build, by default it's set as 'true' by the global config",
    false
  )
  .option('--skipTsc', 'Skip TSC build')
  .option('--onlyCJS', 'Only build for CJS')
  .option('--onlyESM', 'Only build for ESM')
  .option('--onSuccess <cmd>', 'Execute script after successful JS build')
  .option('--skipValidate', 'Skip package.json validation')
  .action(async ({ cwd, input: inputFiles, bundle, clean, onSuccess, onlyCJS, onlyESM, skipTsc, skipValidate }) => {
    const { watcher } = await startWatch({
      rollup: {
        config: {
          cwd,
          inputFiles,
          bundle,
          clean,
          onlyCJS,
          onlyESM,
          skipValidate,
        },
        onSuccessCommand: onSuccess,
      },
      tsc: skipTsc ? false : {},
    });

    return new Promise<void>(resolve => {
      watcher.on('close', () => {
        resolve();
      });
    });
  });
