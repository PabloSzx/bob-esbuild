import { Option, program } from '../deps.js';
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
  .option('-t, --target <target>', 'Javascript runtime target', getDefaultNodeTargetVersion())
  .option('--ignore <files...>', 'Patterns of files to ignore watching')
  .option('--no-sourcemap', 'Disable sourcemap generation')
  .option('--paths', 'Resolve tsconfig paths', false);

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean, command, cwd, target, ignore, sourcemap, paths } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
      command?: string[];
      cwd: string;
      target: string;
      ignore: string[];
      sourcemap?: boolean;
      paths: boolean;
    }>();

    process.chdir(resolve(cwd));

    const [{ getRollupConfig }, { watchRollup }] = await Promise.all([import('../rollupConfig'), import('../watch')]);

    const { inputOptions, outputOptions } = await getRollupConfig({
      entryPoints: Array.isArray(input) ? input : [input],
      format,
      outDir: dir,
      clean,
      target,
      sourcemap,
      paths,
    });

    const { watcher } = await watchRollup({
      input: inputOptions,
      output: outputOptions,
      onSuccessCommands: command,
      ignoreWatch: ignore,
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
