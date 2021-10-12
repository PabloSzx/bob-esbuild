# bob-tsm

[![npm](https://img.shields.io/npm/v/bob-tsm)](https://npm.im/bob-tsm)

Package inspired on https://github.com/lukeed/tsm with extra support for watch mode and with extra fixes to follow the new [TypeScript 4.5 extensions](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/#new-file-extensions) `.mts`=>`ESM` and `.cts`=>`CommonJS`.

## Install

```sh
pnpm add -D bob-tsm esbuild
```

```sh
yarn add -D bob-tsm esbuild
```

```sh
npm install -D bob-tsm esbuild
```

## Usage

Just as [tsm](https://github.com/lukeed/tsm), all the arguments that are not part of `bob-tsm` are passed directly to the `node` executable.

```
Usage: bob-tsm [options] [node arguments...]

Options:
  -V, --version           output the version number
  --tsmconfig <config>    Configuration file path (default: "tsm.js")
  --watch <patterns...>   Enable & specify watch mode
  --ignore <patterns...>  Ignore watch patterns
  --quiet
  --cjs                   Use CommonJS instead of ESM for ".ts" files. You still can use ".mts" to force ESM in
                          specific typescript files.
  -h, --help              display help for command
```
