// note: injected @ build
declare const VERSION: string;

import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { program } from 'commander';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { debouncePromise } from './utils';

program
  .version(VERSION)
  .option('--tsmconfig <config>', 'Configuration file path', 'tsm.js')
  .option('--watch <patterns...>', 'Enable & specify watch mode')
  .option('--ignore <patterns...>', 'Ignore watch patterns')
  .option('--quiet')
  .option(
    '--cjs',
    'Use CommonJS instead of ESM for ".ts" files. You still can use ".mts" to force ESM in specific typescript files.'
  )

  .allowUnknownOption()
  .argument('[node arguments...]');

program
  .parseAsync(process.argv)
  .then(async ({ args }) => {
    const options = program.opts<{
      watch?: string[];
      ignore?: string[];
      cjs?: boolean;
    }>();

    const { watch, ignore, cjs } = options;

    const spawnArgs = ['--loader=' + pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), 'loader.mjs')).href, ...args];
    const spawnOptions: SpawnOptions = {
      stdio: 'inherit',
      env: cjs
        ? {
            ...process.env,
            FORCE_CJS: '1',
          }
        : undefined,
    };
    const spawnNode = () => spawn('node', spawnArgs, spawnOptions);

    if (watch) {
      const [chokidar, { default: kill }] = await Promise.all([import('chokidar'), import('tree-kill')]);

      const watcher = chokidar.watch(watch, {
        ignored: ignore,
        ignoreInitial: true,
      });

      watcher.on('error', console.error);

      const nodeProcesses: ChildProcess[] = [];

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
          for (const nodeProcess of nodeProcesses) {
            if (nodeProcess?.pid) killPromise(nodeProcess.pid);
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

      const execNodeLog = `$ node ${['--loader=bob-tsm', ...args].join(' ')}`;

      async function execNode() {
        while (nodeProcesses.length) {
          const onSuccessProcess = nodeProcesses.shift();
          if (onSuccessProcess?.pid != null) {
            killPromise(onSuccessProcess.pid);
          }
        }

        pendingKillPromises.size && (await Promise.all(pendingKillPromises));

        console.log(execNodeLog);
        nodeProcesses.push(spawnNode());
      }

      const debouncedExec = debouncePromise(
        () => {
          return execNode();
        },
        500,
        console.error
      );

      watcher.on('change', () => {
        debouncedExec();
      });

      execNode();
    } else {
      spawnNode().on('exit', process.exit);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
