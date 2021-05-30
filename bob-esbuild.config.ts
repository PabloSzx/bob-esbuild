export const config: import("bob-esbuild").BobConfig = {
  tsc: {
    dirs: ["examples/*", "packages/*", "!packages/esbuild-plugin"],
  },
  verbose: true,
};
