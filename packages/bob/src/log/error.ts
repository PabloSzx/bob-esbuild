import { makeLabel } from './label';

export function error(...message: any[]) {
  console.error(makeLabel('BOB', 'error'), ...message);
}
