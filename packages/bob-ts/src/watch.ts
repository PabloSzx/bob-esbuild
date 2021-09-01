import type { ChildProcess } from 'child_process';
import { command } from 'execa';
import { InputOptions, OutputOptions, watch as rollupWatch } from 'rollup';
import kill from 'tree-kill';

export interface WatchRollupOptions {
  input: InputOptions;
  output: OutputOptions[];
  onSuccessCommand?: string;
  onSuccessCallback?: (builds: number) => void;
  onStartCallback?: (builds: number) => void;
}

const cwd = process.cwd();

export async function watchRollup(options: WatchRollupOptions) {
  const { input: inputOptions, output: outputOptions } = options;

  const watcher = rollupWatch({
    ...inputOptions,
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
      if (onSuccessProcess?.pid) killPromise(onSuccessProcess.pid);

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

  watcher.on('event', event => {
    switch (event.code) {
      case 'BUNDLE_START': {
        if (onSuccessProcess?.pid) {
          killPromise(onSuccessProcess.pid);
          onSuccessProcess = null;
        }

        options.onStartCallback?.(buildsDone);

        console.log(`Starting build for ${cwd}`);
        break;
      }
      case 'BUNDLE_END': {
        const { result } = event;

        Promise.all(
          outputOptions.map(output => {
            return result.write(output);
          })
        )
          .then(async () => {
            options.onSuccessCallback?.(buildsDone);

            if (pendingKillPromise) await pendingKillPromise;

            if (options.onSuccessCommand) {
              console.log(`$ ${options.onSuccessCommand}`);
              onSuccessProcess = command(options.onSuccessCommand, {
                stdio: 'inherit',
                shell: true,
              });
            }
          })
          .catch(console.error)
          .finally(() => {
            result.close();

            ++buildsDone;
          });

        break;
      }
      case 'START': {
        console.log(`JS watcher for ${cwd} started`);
        break;
      }
    }
  });

  return { watcher, cleanUp };
}
