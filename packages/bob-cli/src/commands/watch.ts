import { startWatch } from 'bob-esbuild/watch';

import { Command, flags } from '@oclif/command';

export default class Watch extends Command {
  static description = 'Watch using rollup+esbuild, all these flags override the bob-esbuild.config';

  static flags = {
    help: flags.help({ char: 'h' }),
    cwd: flags.string({
      description: 'Change target current directory',
    }),
    input: flags.string({
      char: 'i',
      description: "Input pattern files, if not specified, it reads '**/*.ts'. Repeat this flag to specify multiple patterns",
      multiple: true,
    }),
    bundle: flags.boolean({
      description: 'Enable bundling every entry point (With no support for code-splitting yet)',
      allowNo: true,
    }),
    clean: flags.boolean({
      description:
        "DEFAULT=false. Clean the output files before writing the new build, by default it's set as 'true' by the global config",
      allowNo: true,
      default: false,
    }),
    onSuccess: flags.string({
      description: 'Execute script after successful JS build',
    }),
    skipTsc: flags.boolean({
      description: 'Skip TSC build',
    }),
    onlyCJS: flags.boolean({
      description: 'Only build for CJS',
      exclusive: ['onlyESM'],
    }),
    onlyESM: flags.boolean({
      description: 'Only build for ESM',
      exclusive: ['onlyCJS'],
    }),
  };

  async run() {
    const {
      flags: { cwd, input: inputFiles, bundle, clean, onSuccess, onlyCJS, onlyESM, skipTsc },
    } = this.parse(Watch);

    await startWatch({
      rollup: {
        config: {
          cwd,
          inputFiles,
          bundle,
          clean,
          onlyCJS,
          onlyESM,
        },
        onSuccessCommand: onSuccess,
      },
      tsc: skipTsc ? false : {},
    });
  }
}

export type {} from '@oclif/parser/lib/flags';
