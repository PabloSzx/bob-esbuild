const { join } = require('path');
const execa = require('execa');
const { strictEqual } = require('assert');

async function test() {
  const tsFilePath = join(__dirname, 'ts.ts');

  const binFilePath = join(__dirname, '../lib/bin.mjs');

  {
    const { stdout } = await execa('node', [binFilePath, tsFilePath]);

    const lines = stdout.split(/\n|\r\n/g);

    strictEqual(lines.length, 4);
    strictEqual(lines[0], '$ node --require=bob-tsm --loader=bob-tsm --enable-source-maps ' + tsFilePath);
    strictEqual(lines[1], 'CTS CJS');
    strictEqual(lines[2], 'TS ESM');
    strictEqual(lines[3], 'MTS ESM');
  }

  {
    const { stdout } = await execa('node', [binFilePath, '--cjs', tsFilePath]);

    const lines = stdout.split(/\n|\r\n/g);

    strictEqual(lines.length, 4);
    strictEqual(lines[0], '$ node --require=bob-tsm --loader=bob-tsm --enable-source-maps ' + tsFilePath);
    strictEqual(lines[1], 'CTS CJS');
    strictEqual(lines[2], 'TS CJS');
    strictEqual(lines[3], 'MTS ESM');
  }
}

test()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
