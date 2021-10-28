//@ts-nocheck

import './index';
import './index/';

import 'fs';
import('./mts').catch(err => {
  console.error(err);
  process.exit(1);
});
import './cts';

console.log('TS', typeof require === 'undefined' ? 'ESM' : 'CJS');
