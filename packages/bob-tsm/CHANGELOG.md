# bob-tsm

## 0.4.5

### Patch Changes

- c09357a: Set "typescript" as optional peer dependency

## 0.4.4

### Patch Changes

- 23dbed1: ESM: Try resolve adding script extensions (.ts, .tsx, .jsx, ...)

## 0.4.3

### Patch Changes

- 3407fd1: Async check if file exists on ESM
- 4367476: Define `__dirname` & `__filename` for ESM

## 0.4.2

### Patch Changes

- ebf0d1c: Bump recommended esbuild version

## 0.4.1

### Patch Changes

- a138e87: Set "typescript>=4.1.2" as peer dependency

## 0.4.0

### Minor Changes

- ec841fc: New "--paths" CLI option to enable [tsconfig paths](https://www.typescriptlang.org/tsconfig#paths) mapping resolution. The `tsconfig.json` location by default is where `bob-tsm` is called, but it can be customized using the `TS_NODE_PROJECT` environment variable. This mapping is used as a fallback over the default Node.js + Default TypeScript path resolution.

## 0.3.9

### Patch Changes

- 5526c66: Fix: require shouldn't mutate global options

## 0.3.8

### Patch Changes

- 54baca4: Fix esbuild peer dependency range

## 0.3.7

### Patch Changes

- 75c77c6: Update & Require esbuild>=13.14

## 0.3.6

### Patch Changes

- af75da4: Respect import maps

## 0.3.5

### Patch Changes

- 451d9f8: Prevent ".d.ts" imports

## 0.3.4

### Patch Changes

- 6ccfc7b: Improved released package

## 0.3.3

### Patch Changes

- 518f6ee: Add support for "/index" default resolve

## 0.3.2

### Patch Changes

- 0ea9ec7: Fix node spawn log on non-watch mode

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
