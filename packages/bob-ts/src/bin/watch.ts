import { Option, program } from 'commander';
import { resolve } from 'path';
import { getDefaultNodeTargetVersion } from '../defaults';

program
  .option('-d, --dir <directory>', 'Custom output dir', 'dist')
  .option('-i, --input <patterns...>', 'Input patterns', '.')
  .addOption(new Option('-f, --format <format>', 'Output format').default('esm').choices(['cjs', 'esm', 'interop']))
  .option('--clean', 'Clean output dir', false)
  .option('--cwd <dir>', 'Custom target directory', process.cwd())
  .option(
    '-c, --command <commands...>',
    'Execute scripts after successful JS build, You can specify more than a single command to be executed concurrently'
  )
  .option('-t, --target <target>', 'Javascript runtime target', getDefaultNodeTargetVersion());

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean, command, cwd, target } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
      command?: string[];
      cwd: string;
      target: string;
    }>();

    process.chdir(resolve(cwd));

    const [{ getRollupConfig }, { watchRollup }] = await Promise.all([import('../rollupConfig'), import('../watch')]);

    const { inputOptions, outputOptions } = await getRollupConfig({
      entryPoints: Array.isArray(input) ? input : [input],
      format,
      outDir: dir,
      clean,
      target,
    });

    const { watcher } = await watchRollup({
      input: inputOptions,
      output: outputOptions,
      onSuccessCommands: command,
    });

    return new Promise<void>(resolve => {
      watcher.on('close', () => {
        resolve();
      });
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
