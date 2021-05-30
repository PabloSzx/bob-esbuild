import { globalConfig } from '../config/globalCosmiconfig';
import { makeLabel } from './label';

export async function debug(...message: any[]) {
  const debugEnabled = (globalConfig.current || (await globalConfig)).config.verbose;

  if (debugEnabled) console.log(makeLabel('BOB', 'info'), ...message);
}
