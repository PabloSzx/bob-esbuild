import type { ChildProcess } from 'child_process';
import { FSWatcher, watch, WatchOptions } from 'chokidar';
import { command } from 'execa';
import kill from 'tree-kill';
import { debouncePromise } from './utils';

export function StartWatcher({
  paths,
  ignored,
  onError = console.error,
  commands,
  callbacks,
  chokidarOptions,
  quiet,
}: {
  paths: string[];
  ignored?: string[];
  commands?: string[];
  callbacks?: Array<() => void>;
  quiet?: boolean;
  /**
   * @default console.error
   */
  onError?: (err: unknown) => void;
  chokidarOptions?: WatchOptions;
}) {
  const watcher: FSWatcher = watch(paths, {
    ignored,
    ignoreInitial: true,
    ...chokidarOptions,
  });

  watcher.on('error', onError);

  const commandProcesses: ChildProcess[] = [];

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

  function cleanUp() {
    try {
      for (const cmdProcess of commandProcesses) {
        if (cmdProcess?.pid) killPromise(cmdProcess.pid);
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

  async function exec() {
    while (commandProcesses.length) {
      const cmdProcess = commandProcesses.shift();
      if (cmdProcess?.pid != null) {
        killPromise(cmdProcess.pid);
      }
    }

    pendingKillPromises.size && (await Promise.all(pendingKillPromises));

    await Promise.allSettled([
      ...(callbacks?.map(cb => cb()) || []),
      ...(commands?.map(async cmd => {
        if (!quiet) console.log(`$ ${cmd}`);
        commandProcesses.push(
          command(cmd, {
            stdio: 'inherit',
            shell: true,
          })
        );
      }) || []),
    ]);
  }

  const debouncedExec = debouncePromise(
    () => {
      return exec();
    },
    500,
    console.error
  );

  watcher.on('change', path => {
    if (!quiet) console.log(`${path} changed.`);
    debouncedExec();
  });

  exec();

  return {
    watcher,
    pendingKillPromises,
    commandProcesses,
  };
}
