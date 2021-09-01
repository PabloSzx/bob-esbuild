import assert from 'assert';
import { program } from 'commander';
import { buildCode } from './index';

program
  .requiredOption('-d, --dir <directory>', 'Custom output dir', 'dist')
  .requiredOption('-i, --input <patterns...>', 'Input patterns')
  .option('-f, --format <format>', "Format, it can be 'cjs', 'esm' or 'both'", 'esm')
  .option('-c, --clean', 'Clean output dir', false);

program
  .parseAsync()
  .then(async () => {
    const { dir, input, format, clean } = program.opts<{
      dir: string;
      input: string[];
      format: 'cjs' | 'esm' | 'both';
      clean: boolean;
    }>();
    assert(['cjs', 'esm', 'both'].includes(format), "Format has to be 'cjs', 'esm' or 'both'");
    buildCode({
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
