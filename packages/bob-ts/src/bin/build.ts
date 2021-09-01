import assert from 'assert';
import { program } from 'commander';
import { resolve } from 'path';

program
  .option('-d, --dir <directory>', 'Custom output dir', 'dist')
  .option('-i, --input <patterns...>', 'Input patterns', '.')
  .option('-f, --format <format>', "Format, it can be 'cjs', 'esm' or 'interop'", 'esm')
  .option('--cwd <dir>', 'Custom target directory', process.cwd())
  .option('--no-clean', "Don't clean output dir (default: true)", true)
  .option('-t, --target <target>', 'Javascript runtime target', 'node' + process.versions.node);

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean, cwd, target } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
      cwd: string;
      target: string;
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
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
