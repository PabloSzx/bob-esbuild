import assert from 'assert';
import { program } from 'commander';
import { buildCode } from '../build';

program
  .option('-d, --dir <directory>', 'Custom output dir', 'dist')
  .option('-i, --input <patterns...>', 'Input patterns', '.')
  .option('-f, --format <format>', "Format, it can be 'cjs', 'esm' or 'interop'", 'esm')
  .option('--no-clean', 'Clean output dir', true);

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'interop';
      clean: boolean;
    }>();

    assert(['cjs', 'esm', 'interop'].includes(format), "Format has to be 'cjs', 'esm' or 'interop'");
    await buildCode({
      entryPoints: Array.isArray(input) ? input : [input],
      format,
      outDir: dir,
      clean,
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
