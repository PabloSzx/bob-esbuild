export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['examples/*', 'packages/*'],
  },
  distDir: 'lib',
  verbose: true,
  outputOptions: {
    sourcemap: false,
  },
  plugins: [
    {
      name: 'keep-dynamic-import',
      renderDynamicImport() {
        return {
          left: 'import(',
          right: ')',
        };
      },
    },
  ],
};
