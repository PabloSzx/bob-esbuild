const { join } = require('path');
const execa = require('execa');
const { strictEqual } = require('assert');

async function test() {
  {
    const { stdout } = await execa('node', [join(__dirname, '../lib/bin.mjs'), join(__dirname, 'ts.ts')]);

    const lines = stdout.split(/\n|\r\n/g);

    strictEqual(lines.length, 3);
    strictEqual(lines[0], 'CTS CJS');
    strictEqual(lines[1], 'TS ESM');
    strictEqual(lines[2], 'MTS ESM');
  }

  {
    const { stdout } = await execa('node', [join(__dirname, '../lib/bin.mjs'), '--cjs', join(__dirname, 'ts.ts')]);

    const lines = stdout.split(/\n|\r\n/g);

    strictEqual(lines.length, 3);
    strictEqual(lines[0], 'CTS CJS');
    strictEqual(lines[1], 'TS CJS');
    strictEqual(lines[2], 'MTS ESM');
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
