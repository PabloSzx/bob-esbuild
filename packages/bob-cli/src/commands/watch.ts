import { startWatch } from 'bob-esbuild/lib/watch';

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
      description: "Clean the output files before writing the new build, by default it's set as 'true' by the global config",
      allowNo: true,
    }),
    onSuccess: flags.string({
      description: 'Execute script after successful JS build',
    }),
  };

  async run() {
    const {
      flags: { cwd, input: inputFiles, bundle, clean, onSuccess },
    } = this.parse(Watch);

    await startWatch({
      rollup: {
        config: {
          cwd,
          inputFiles,
          bundle,
          clean,
        },
        onSuccessCommand: onSuccess,
      },
      tsc: {},
    });
  }
}

export type {} from '@oclif/parser/lib/flags';
