export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['examples/*', 'packages/*'],
  },
  distDir: 'lib',
  verbose: true,
  outputOptions: {
    sourcemap: true,
  },
};
