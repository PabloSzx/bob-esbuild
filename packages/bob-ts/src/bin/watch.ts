import assert from 'assert';
import { program } from 'commander';
import { resolve } from 'path';

program
  .option('-d, --dir <directory>', 'Custom output dir', 'dist')
  .option('-i, --input <patterns...>', 'Input patterns', '.')
  .option('-f, --format <format>', "Format, it can be 'cjs', 'esm' or 'interop'", 'esm')
  .option('--clean', 'Clean output dir (default: false)', false)
  .option('--cwd <dir>', 'Custom target directory', process.cwd())
  .option('-c, --command <cmd>', 'Execute script after successful JS build')
  .option('-t, --target <target>', 'Javascript runtime target', 'node' + process.versions.node);

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean, command, cwd, target } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
      command?: string;
      cwd: string;
      target: string;
    }>();

    process.chdir(resolve(cwd));

    assert(['cjs', 'esm', 'interop'].includes(format), "Format has to be 'cjs', 'esm' or 'interop'");

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
      onSuccessCommand: command,
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
