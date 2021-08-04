# bob-esbuild

## 0.2.1

### Patch Changes

- 8f52656: rmSync -> unlinkSync
- 91772d6: rollback globby to v11

## 0.2.0

### Minor Changes

- 1d3375e: update deps

### Patch Changes

- Updated dependencies [7dadf1b]
- Updated dependencies [1d3375e]
  - bob-esbuild-plugin@0.2.0

## 0.1.27

### Patch Changes

- dd3dd9d: fix concurrent tsc hash write log errors

## 0.1.26

### Patch Changes

- 7afb215: remove hash on tsc error
- a0aaffa: add support for "buildConfig.input"

## 0.1.25

### Patch Changes

- b96c19b: (tsc) support custom tsconfig path

## 0.1.24

### Patch Changes

- 3272150: add warn logging

## 0.1.23

### Patch Changes

- 1556971: allow skipTsc in watch mode
- 0aabb50: add skipAutoTSCBuild config
- b4ee29a: allow only build cjs/esm
- d3806f2: rewrite package.json exports only if specified

## 0.1.22

### Patch Changes

- fe24982: allow skip tsc build && default clean false on watch

## 0.1.21

### Patch Changes

- c9d38ba: fix package.json rewrite w/ workspace protocol & sync packages
- Updated dependencies [c9d38ba]
  - bob-esbuild-plugin@0.1.21

## 0.1.20

### Patch Changes

- 312fa02: skip package.json rewrite in subdir while validating files property

## 0.1.19

### Patch Changes

- a47e85c: fix gen package json with empty dir folder
- 63bcf77: allow package without main module

## 0.1.18

### Patch Changes

- 26f57cb: pnpm with publishConfig.directory
- Updated dependencies [26f57cb]
  - bob-esbuild-plugin@0.1.18

## 0.1.17

### Patch Changes

- f0c7788: allow not use esbuild plugin
- 0092814: add buildOptions.bin support
- 25ae121: allow tsc hash customization
- ed7a61c: rename rollupoptions & add support for package.json buildConfig with copy dist
- faf71da: sync
- Updated dependencies [0092814]
- Updated dependencies [faf71da]
  - bob-esbuild-plugin@0.1.17

## 0.1.14

### Patch Changes

- 4ba5263: rewrite package.json for publish & allow custom dir

## 0.1.13

### Patch Changes

- e28bf30: include tsx files by default

## 0.1.12

### Patch Changes

- 4c678c8: improve build
- Updated dependencies [4c678c8]
  - bob-esbuild-plugin@0.1.1
