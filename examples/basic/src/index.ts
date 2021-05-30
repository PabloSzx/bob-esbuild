import { Foo } from 'shared';

import { Bar } from 'shared/deep/two-deep/other';
import { C } from './innerShared';

/**
 * XD
 */
export const A = C * 1;

console.log(Foo);

console.log(Bar);

export { Foo, Bar };

export { B } from './other';
