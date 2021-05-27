import { Foo } from "depended";

import { Bar } from "depended/deep/two-deep/other";

/**
 * XD
 */
export const A = 1;

console.log(Foo);

console.log(Bar);

export { Foo, Bar };
