export const tsup: import("tsup").Options = {
  entryPoints: ["src/index.ts"],
  format: ["esm", "cjs"],
  silent: true,
  onSuccess: "tsc",
};
