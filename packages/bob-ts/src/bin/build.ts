import assert from 'assert';
import { program } from 'commander';
import { resolve } from 'path';
import { getDefaultNodeTargetVersion } from '../defaults';

program
  .option('-d, --dir <directory>', 'Custom output dir', 'dist')
  .option('-i, --input <patterns...>', 'Input patterns', '.')
  .option('-f, --format <format>', "Format, it can be 'cjs', 'esm' or 'interop'", 'esm')
  .option('--cwd <dir>', 'Custom target directory', process.cwd())
  .option('--no-clean', "Don't clean output dir (default: true)", true)
  .option('-t, --target <target>', 'Javascript runtime target', getDefaultNodeTargetVersion())
  .option('--no-sourcemap', 'Disable sourcemap generation');

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean, cwd, target, sourcemap } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
      cwd: string;
      target: string;
      sourcemap?: boolean;
    }>();

    process.chdir(resolve(cwd));

    assert(['cjs', 'esm', 'interop'].includes(format), "Format has to be 'cjs', 'esm' or 'interop'");

    const { buildCode } = await import('../build');
    await buildCode({
      entryPoints: Array.isArray(input) ? input : [input],
      format,
      outDir: dir,
      clean,
      target,
      sourcemap,
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
