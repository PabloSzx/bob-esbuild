# bob-tsm

## 0.3.1

### Patch Changes

- b8a7fd7: Silence warning: `"--experimental-loader is an experimental feature"`

## 0.3.0

### Minor Changes

- 05e11ab: - New option `--node-env` / `--node_env` to automatically add the specified option as `NODE_ENV` environment variable, `"prod"` is an alias for "production" and `"dev"` is an alias for "development". For example: `bob-tsm --node-env=dev --watch=src src/index.ts` or `bob-tsm --node-env=prod src/index.ts`
  - Automatically add `--enable-source-maps` flag
  - Fix `--tsmconfig` and `--quiet` usage
  - Watch mode prints what file paths have changed and caused the re-execution, you can use `--quiet` or `-q` to silence them.

## 0.2.4

### Patch Changes

- 061905b: Remove "--loader" from `process.execArgv` to fix applications that rely on forked Node.js sub-processes like Next.js Custom Server, you can opt-out specifying "KEEP_LOADER_ARGV" environment variable.

## 0.2.3

### Patch Changes

- 79e89ce: Update to use new consolidated hooks with backwards compatibility https://github.com/nodejs/node/pull/37468

## 0.2.2

### Patch Changes

- 1993fa1: Fix chokidar as dep

## 0.2.1

### Patch Changes

- bf740bd: Fix and test ESM/CJS Interop

## 0.2.0

### Minor Changes

- ffecc6a: add "--cjs" option to use CommonJS instead of ESM for ".ts" files

## 0.1.2

### Patch Changes

- 25c1bcb: Fix windows

## 0.1.1

### Patch Changes

- 817e5a9: Fix windows usage

## 0.1.0

### Minor Changes

- 1450803: `bob-tsm` release 🎉, inspired on https://github.com/lukeed/tsm with extra watch mode & following TypeScript 4.5 `.cts` & `mts` extensions behavior
