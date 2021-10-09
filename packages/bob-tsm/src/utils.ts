// CREDITS TO lukeed https://github.com/lukeed/tsm

import { resolve } from 'path';
import { existsSync } from 'fs';

import type { Format } from 'esbuild';
import type { Config, Options, Extension, ConfigFile } from '../config';
export interface Defaults {
  file: string | false;
  isESM: boolean;
  options: Options;
}

export const defaults = function (format: Format): Defaults {
  let { FORCE_COLOR, NO_COLOR, NODE_DISABLE_COLORS, TERM } = process.env;

  let argv = process.argv.slice(2);

  let flags = new Set(argv);
  let isQuiet = flags.has('-q') || flags.has('--quiet');

  // @see lukeed/kleur
  let enabled =
    !NODE_DISABLE_COLORS &&
    NO_COLOR == null &&
    TERM !== 'dumb' &&
    ((FORCE_COLOR != null && FORCE_COLOR !== '0') || process.stdout.isTTY);

  let idx = flags.has('--tsmconfig') ? argv.indexOf('--tsmconfig') : -1;
  let file = resolve('.', (!!~idx && argv[++idx]) || 'tsm.js');

  return {
    file: existsSync(file) && file,
    isESM: format === 'esm',
    options: {
      format: format,
      charset: 'utf8',
      sourcemap: 'inline',
      target: 'node' + process.versions.node,
      logLevel: isQuiet ? 'silent' : 'warning',
      color: enabled,
    },
  };
};

export const finalize = function (env: Defaults, custom?: ConfigFile): Config {
  let base = env.options;
  if (custom && custom.common) {
    Object.assign(base, custom.common!);
    delete custom.common; // loop below
  }

  let config: Config = {
    '.mts': { ...base, format: 'esm', loader: 'ts' },
    '.jsx': { ...base, loader: 'jsx' },
    '.tsx': { ...base, loader: 'tsx' },
    '.cts': { ...base, format: 'cjs', loader: 'ts' },
    '.ts': { ...base, loader: 'ts' },
  };

  if (env.isESM) {
    config['.json'] = { ...base, loader: 'json' };
  } else {
    config['.mjs'] = { ...base, loader: 'js' };
  }

  let extn: Extension;
  if (custom && custom.loaders) {
    for (extn in custom.loaders)
      config[extn] = {
        ...base,
        loader: custom.loaders[extn],
      };
  } else if (custom) {
    let conf = (custom.config || custom) as Config;
    for (extn in conf) config[extn] = { ...base, ...conf[extn] };
  }

  return config;
};

export function debouncePromise<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  delay: number,
  onError: (err: unknown) => void
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  let promiseInFly: Promise<void> | undefined;

  let callbackPending: (() => void) | undefined;

  return function debounced(...args: Parameters<typeof fn>) {
    if (promiseInFly) {
      callbackPending = () => {
        debounced(...args);
        callbackPending = undefined;
      };
    } else {
      if (timeout != null) clearTimeout(timeout);

      timeout = setTimeout(() => {
        timeout = undefined;
        promiseInFly = fn(...args)
          .catch(onError)
          .finally(() => {
            promiseInFly = undefined;
            if (callbackPending) callbackPending();
          });
      }, delay);
    }
  };
}
