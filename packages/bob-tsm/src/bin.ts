// note: injected @ build
declare const VERSION: string;

import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { Option, program } from 'commander';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { debouncePromise } from './utils';

program
  .version(VERSION)
  .option('--tsmconfig <config>', 'Configuration file path', 'tsm.js')
  .option('--watch <patterns...>', 'Enable & specify watch mode')
  .option('--ignore <patterns...>', 'Ignore watch patterns')
  .addOption(
    new Option(
      '--node-env,--node_env <NODE_ENV>',
      'Automatically add the specified option as NODE_ENV environment variable, "prod" is an alias for "production" and "dev" is an alias for "development"'
    ).choices(['production', 'prod', 'development', 'dev', 'test'])
  )
  .option('-q, --quiet')
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
      tsmconfig?: string;
      node_env: 'production' | 'prod' | 'development' | 'dev' | 'test';
      quiet?: boolean;
    }>();

    const { watch, ignore, cjs, node_env, quiet, tsmconfig } = options;

    const binDirname = dirname(fileURLToPath(import.meta.url));

    const spawnArgs = [
      '--require=' + join(binDirname, 'require.js'),
      '--loader=' + pathToFileURL(join(binDirname, 'loader.mjs')).href,
      '--enable-source-maps',
    ];

    if (tsmconfig && existsSync(tsmconfig)) {
      spawnArgs.push('--tsmconfig', tsmconfig);
    }

    if (quiet) {
      spawnArgs.push('--quiet');
    }

    spawnArgs.push(...args);

    let execNodeLog = `$ node ${['--require=bob-tsm', '--loader=bob-tsm', ...spawnArgs.slice(2)].join(' ')}`;

    let spawnEnv: NodeJS.ProcessEnv | undefined;

    if (cjs) {
      Object.assign((spawnEnv ||= { ...process.env }), { FORCE_CJS: '1' });
    }

    if (node_env) {
      const NODE_ENV = node_env === 'prod' ? 'production' : node_env === 'dev' ? 'development' : node_env;
      Object.assign((spawnEnv ||= { ...process.env }), {
        NODE_ENV,
      });

      execNodeLog = execNodeLog.replace('$ node', `$ NODE_ENV=${NODE_ENV} node`);
    }

    const spawnOptions: SpawnOptions = {
      stdio: 'inherit',
      env: spawnEnv,
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

      async function execNode() {
        while (nodeProcesses.length) {
          const onSuccessProcess = nodeProcesses.shift();
          if (onSuccessProcess?.pid != null) {
            killPromise(onSuccessProcess.pid);
          }
        }

        pendingKillPromises.size && (await Promise.all(pendingKillPromises));

        if (!quiet) console.log(execNodeLog);
        nodeProcesses.push(spawnNode());
      }

      const debouncedExec = debouncePromise(
        () => {
          return execNode();
        },
        500,
        console.error
      );

      watcher.on('change', path => {
        if (!quiet) console.log(`[bob-tsm] ${path} changed.`);
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
