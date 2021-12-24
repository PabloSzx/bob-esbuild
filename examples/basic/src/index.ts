import { Foo } from 'shared';

import { Bar } from 'shared/deep/two-deep/other';
import { C } from './innerShared';
import { createRequire } from 'module';

const require = createRequire(typeof __filename !== 'undefined' ? __filename : import.meta.url);

/**
 * XD
 */
export const A = C * 1;

console.log('node', process.version);

import('shared/package.json').then(({ default: { name, version } }) => console.log('esm', { name, version }));
Promise.resolve(require('shared/package.json')).then(({ name, version }) => console.log('cjs', { name, version }));

console.log(Foo);

console.log(Bar);

export { Foo, Bar };

export { B } from './other';

import { Hello } from 'aliased-deep';

console.log(Hello);
