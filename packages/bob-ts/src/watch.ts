import type { ChildProcess } from 'child_process';
import { command } from 'execa';
import type { InputOptions, OutputOptions } from 'rollup';
import kill from 'tree-kill';

export interface WatchRollupOptions {
  input: InputOptions;
  output: OutputOptions[];
  onSuccessCommands?: string[];
  onSuccessCallback?: (builds: number) => void;
  onStartCallback?: (builds: number) => void;
  ignoreWatch?: string | string[];
}

const cwd = process.cwd();

export async function watchRollup(options: WatchRollupOptions) {
  const { watch: rollupWatch } = await import('rollup');
  const { input: inputOptions, output: outputOptions, ignoreWatch } = options;

  const watcher = rollupWatch({
    ...inputOptions,
    output: outputOptions,

    watch: {
      skipWrite: true,
      buildDelay: 500,
      chokidar: {
        ignoreInitial: false,
      },
      exclude: ignoreWatch,
    },
  });

  const onSuccessProcesses: ChildProcess[] = [];

  function cleanUp() {
    try {
      for (const onSuccessProcess of onSuccessProcesses) {
        if (onSuccessProcess?.pid) killPromise(onSuccessProcess.pid);
      }

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

  const pendingKillPromises = new Set<Promise<void>>();

  function killPromise(pid: number) {
    const pendingKillPromise = new Promise<void>(resolve => {
      kill(pid, () => {
        resolve();
        pendingKillPromises.delete(pendingKillPromise);
      });
    });

    pendingKillPromises.add(pendingKillPromise);
  }

  let buildsDone = 0;

  let lastStart = Date.now();

  watcher.on('event', event => {
    switch (event.code) {
      case 'BUNDLE_START': {
        {
          while (onSuccessProcesses.length) {
            const onSuccessProcess = onSuccessProcesses.shift();
            if (onSuccessProcess?.pid != null) {
              killPromise(onSuccessProcess.pid);
            }
          }
        }

        options.onStartCallback?.(buildsDone);

        lastStart = Date.now();
        break;
      }
      case 'BUNDLE_END': {
        const { result } = event;

        (async () => {
          try {
            await Promise.all(
              outputOptions.map(output => {
                return result.write(output);
              })
            );

            console.log(`[${new Date().toLocaleString()}] Build success for ${cwd} in ${Date.now() - lastStart}ms`);

            options.onSuccessCallback?.(buildsDone);

            pendingKillPromises.size && (await Promise.all(pendingKillPromises));

            if (options.onSuccessCommands) {
              for (const onSuccessCommand of options.onSuccessCommands) {
                console.log(`$ ${onSuccessCommand}`);
                onSuccessProcesses.push(
                  command(onSuccessCommand, {
                    stdio: 'inherit',
                    shell: true,
                  })
                );
              }
            }
          } catch (err) {
            console.error(err);
          } finally {
            result.close().catch(console.error);

            ++buildsDone;
          }
        })();

        break;
      }
      case 'ERROR': {
        console.error(event.error.message ? `\n[${new Date().toLocaleString()}] [ERROR]: ${event.error.message}\n` : event.error);
        break;
      }
      case 'START': {
        break;
      }
    }
  });

  return { watcher, cleanUp };
}
