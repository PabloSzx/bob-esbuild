import { startBuild } from 'bob-esbuild/lib/build';

import { Command, flags } from '@oclif/command';

export default class Build extends Command {
  static description = 'Build using rollup+esbuild, all these flags override the bob-esbuild.config';

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
  };

  async run() {
    const {
      flags: { cwd, input: inputFiles, bundle, clean },
    } = this.parse(Build);

    await startBuild({
      rollup: {
        cwd,
        inputFiles,
        bundle,
        clean,
      },
      tsc: {},
    });
  }
}

export type {} from '@oclif/parser/lib/flags';
