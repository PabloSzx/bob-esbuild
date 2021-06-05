import { makeLabel } from './label';

export async function warn(...message: any[]) {
  console.warn(makeLabel('BOB', 'warn'), ...message);
}
