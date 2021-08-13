import { Foo } from 'shared';

import { Bar } from 'shared/deep/two-deep/other';
import { C } from './innerShared';

/**
 * XD
 */
export const A = C * 1;

import('shared/package.json').then(({ default: { name, version } }) => console.log('esm', { name, version }));
Promise.resolve(require('shared/package.json')).then(({ name, version }) => console.log('cjs', { name, version }));

console.log(Foo);

console.log(Bar);

export { Foo, Bar };

export { B } from './other';
