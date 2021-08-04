import { startBuild } from 'bob-esbuild/build';

import { Command } from 'commander';

export const BuildCommand = new Command('build')
  .description('Build using rollup+esbuild, all these flags override the bob-esbuild.config')
  .option('--cwd <dir>', 'Change target current directory')
  .option('-i --input <file...>', "Input pattern files, if not specified, it reads '**/*.ts'")
  .option('--bundle', 'Enable bundling every entry point (With no support for code-splitting)')
  .option('--clean', "Clean the output files before writing the new build, by default it's set as 'true' by the global config")
  .option('--skipTsc', 'Skip TSC build')
  .option('--onlyCJS', 'Only build for CJS')
  .option('--onlyESM', 'Only build for ESM')
  .action(async ({ cwd, inputFiles, bundle, clean, onlyCJS, onlyESM, skipTsc }) => {
    await startBuild({
      rollup: {
        cwd,
        inputFiles,
        bundle,
        clean,
        onlyCJS,
        onlyESM,
      },
      tsc: skipTsc ? false : {},
    });
  });
