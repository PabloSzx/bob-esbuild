import { resolve } from 'path';

export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['examples/*', 'packages/*'],
  },
  distDir: 'lib',
  verbose: true,
  outputOptions: {
    sourcemap: false,
  },
  keepDynamicImport: true,
  useTsconfigPaths: true,
  packageConfigs: {
    'bob-ts': {
      external: ['./watchDeps.js', './deps.js', '../deps.js'],
      clean: true,
      globbyOptions: {
        ignore: [resolve('./src/deps.ts'), resolve('./src/watchDeps.ts')],
      },
    },
  },
};
