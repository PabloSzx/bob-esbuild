import colors from 'chalk';
import { format } from 'date-fns';

export const makeLabel = (input: string, type: 'info' | 'success' | 'error') =>
  colors[type === 'info' ? 'bgBlue' : type === 'error' ? 'bgRed' : 'bgGreen'](
    colors.black(`[${input.toUpperCase()}-${format(new Date(), 'kk:mm:s')}]`)
  );
