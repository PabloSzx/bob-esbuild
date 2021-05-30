export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['examples/*', 'packages/*'],
  },
  verbose: true,
  outputOptions: {
    sourcemap: 'inline',
  },
};
