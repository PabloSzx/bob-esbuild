import colors from 'chalk';
import { format } from 'date-fns';

export const makeLabel = (input: string, type: 'info' | 'success' | 'error' | 'warn') =>
  colors[type === 'info' ? 'bgBlue' : type === 'warn' ? 'bgYellow' : type === 'error' ? 'bgRed' : 'bgGreen'](
    colors.black(`[${input.toUpperCase()}-${format(new Date(), 'kk:mm:s')}]`)
  );
