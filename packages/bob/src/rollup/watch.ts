import { command } from 'execa';
import { watch as rollupWatch } from 'rollup';
import kill from 'tree-kill';

import { ConfigOptions, getRollupConfig } from '../config/rollup';
import { debug } from '../log/debug';
import { error } from '../log/error';

import type { ChildProcess } from 'child_process';

export interface WatchRollupOptions {
  config?: ConfigOptions;
  onSuccessCommand?: string;
  onSuccessCallback?: (builds: number) => void;
  onStartCallback?: (builds: number) => void;
}

export async function watchRollup(options: WatchRollupOptions = {}) {
  const { config, outputOptions, write } = await getRollupConfig(options.config);

  let startTime = Date.now();

  const watcher = rollupWatch({
    ...config,
    output: outputOptions,

    watch: {
      skipWrite: true,
      buildDelay: 1000,
      chokidar: {
        ignoreInitial: false,
      },
    },
  });

  let onSuccessProcess: ChildProcess | null = null;

  function cleanUp() {
    try {
      if (onSuccessProcess) killPromise(onSuccessProcess.pid);

      watcher.close();
    } catch (err) {
    } finally {
      process.exit(0);
    }
  }

  process.on('SIGINT', cleanUp);
  process.on('SIGHUP', cleanUp);
  process.on('SIGQUIT', cleanUp);
  process.on('SIGTERM', cleanUp);
  process.on('uncaughtException', cleanUp);
  process.on('exit', cleanUp);

  let pendingKillPromise: Promise<void>;

  function killPromise(pid: number) {
    return (pendingKillPromise = new Promise(resolve => {
      kill(pid, () => {
        resolve();
      });
    }));
  }

  let buildsDone = 0;

  const cwd = (options.config?.cwd || process.cwd()).replace(/\\/g, '/');

  watcher.on('event', event => {
    switch (event.code) {
      case 'BUNDLE_START': {
        if (onSuccessProcess) {
          killPromise(onSuccessProcess.pid);
          onSuccessProcess = null;
        }

        options.onStartCallback?.(buildsDone);

        startTime = Date.now();

        debug(`Starting build for ${cwd}`);
        break;
      }
      case 'BUNDLE_END': {
        const { result } = event;

        write(result)
          .then(async () => {
            debug(`JS built for ${cwd} in ${Date.now() - startTime}ms`);

            options.onSuccessCallback?.(buildsDone);

            if (pendingKillPromise) await pendingKillPromise;

            if (options.onSuccessCommand) {
              debug(`$ ${options.onSuccessCommand}`);
              onSuccessProcess = command(options.onSuccessCommand, {
                stdio: 'inherit',
                shell: true,
              });
            }
          })
          .catch(error)
          .finally(() => {
            result.close();

            ++buildsDone;
          });

        break;
      }
      case 'START': {
        debug(`JS watcher for ${cwd} started`);
        break;
      }
    }
  });

  return { watcher, cleanUp };
}
