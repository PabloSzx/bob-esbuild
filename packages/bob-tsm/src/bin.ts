// note: injected @ build
declare const VERSION: string;

import { ChildProcess, spawn } from 'child_process';
import { program } from 'commander';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { debouncePromise } from './utils';

program
  .version(VERSION)
  .option('--tsmconfig <config>', 'Configuration file path', 'tsm.js')
  .option('--watch <patterns...>', 'Enable & specify watch mode')
  .option('--ignore <patterns...>', 'Ignore watch patterns')
  .option('--quiet')

  .allowUnknownOption()
  .argument('[node arguments...]');

program
  .parseAsync(process.argv)
  .then(async ({ args }) => {
    const options = program.opts<{
      watch?: string[];
      ignore?: string[];
    }>();

    const { watch, ignore } = options;

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

      async function execNode() {
        while (nodeProcesses.length) {
          const onSuccessProcess = nodeProcesses.shift();
          if (onSuccessProcess?.pid != null) {
            killPromise(onSuccessProcess.pid);
          }
        }

        pendingKillPromises.size && (await Promise.all(pendingKillPromises));

        console.log(`$ node ${['--loader=bob-tsm', ...args].join(' ')}`);
        nodeProcesses.push(
          spawn('node', ['--loader=' + pathToFileURL(join(__dirname, 'loader.mjs')).href, ...args], {
            stdio: 'inherit',
          })
        );
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
      spawn('node', ['--loader=' + pathToFileURL(join(__dirname, 'loader.mjs')).href, ...args], {
        stdio: 'inherit',
      }).on('exit', process.exit);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
