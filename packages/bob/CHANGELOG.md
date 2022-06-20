# bob-esbuild

## 4.0.2

### Patch Changes

- 765968e: Don't add "types" field if it doesn't already exists on package.json

## 4.0.1

### Patch Changes

- 22bb51b: Re-export writePackageJson and rewritePackageJson from index
- caf3cac: exports["."] is not required for rewrite package json

## 4.0.0

### Major Changes

- 9fb97f8: Require Node.js >=14.13.1

### Patch Changes

- Updated dependencies [9fb97f8]
  - bob-esbuild-plugin@4.0.0

## 3.2.6

### Patch Changes

- ee099eb: Update dependencies
- Updated dependencies [ee099eb]
  - bob-esbuild-plugin@3.1.5

## 3.2.5

### Patch Changes

- 4889dc1: Bump
- Updated dependencies [4889dc1]
  - bob-esbuild-plugin@3.1.4

## 3.2.4

### Patch Changes

- edbb808: fix package.json rewrite & "type":"module" usage
- 5d2289b: Update bundled globby version to v13.1.1

## 3.2.3

### Patch Changes

- 0696aae: allow to rewrite package.json before writeFile with config "rewritePackage" & improve PackageJSON type
- ab336b9: Keep "peerDependenciesMeta" on package.json rewrite

## 3.2.2

### Patch Changes

- bd58512: Use typescript peer dependency
- ebf0d1c: Bump recommended esbuild version
- Updated dependencies [ebf0d1c]
  - bob-esbuild-plugin@3.1.3

## 3.2.1

### Patch Changes

- 54baca4: Fix esbuild peer dependency range
- Updated dependencies [54baca4]
  - bob-esbuild-plugin@3.1.2

## 3.2.0

### Minor Changes

- a4a848d: Support JSON imports out-of-the-box

### Patch Changes

- 75c77c6: Update & Require esbuild>=13.14
- Updated dependencies [75c77c6]
  - bob-esbuild-plugin@3.1.1

## 3.1.1

### Patch Changes

- 2939cca: watch mode always logs errors

## 3.1.0

### Minor Changes

- 1c3c506: Bundle dependencies

### Patch Changes

- 17d1680: new outputOptions config
- b89ee69: Add external and globby options
- Updated dependencies [078402e]
  - bob-esbuild-plugin@3.1.0

## 3.0.2

### Patch Changes

- f6106d8: Support rewrite exports types

## 3.0.1

### Patch Changes

- 99f5fe6: Improve plugin promise resolution

## 3.0.0

### Major Changes

- c783b22: Only copy typescript definitions on currently building project

### Patch Changes

- afd2edb: add skipValidate option
- 0ecbd1c: Fix packageConfigs defaults
- a695127: Fix circular import
- b8a13ba: New "useTsconfigPaths" global config that resolves root tsconfig "paths"

  Closes #156

## 2.2.0

### Minor Changes

- f667154: support "type": "module", flexible package.json validation, improved per-package config, manual package.json rewrite, remove sucrase dep

### Patch Changes

- f27ff9a: Fix bin output ESM or CJS based on extension
- Updated dependencies [816d97e]
  - bob-esbuild-plugin@2.2.0

## 2.1.1

### Patch Changes

- b5eac61: Dynamic rollup import

  closes #159

## 2.1.0

### Minor Changes

- 19b48c5: Improve tsconfig resolution using [tsconfck](https://github.com/dominikg/tsconfck)

### Patch Changes

- Updated dependencies [19b48c5]
  - bob-esbuild-plugin@2.1.0

## 2.0.1

### Patch Changes

- 9e061f9: allow function in keepDynamicImport config

## 2.0.0

### Major Changes

- 7678c9a: esbuild as peer dependency

### Patch Changes

- Updated dependencies [7678c9a]
  - bob-esbuild-plugin@2.0.0

## 1.3.0

### Minor Changes

- 698d845: Improve package.json exports rewrite

## 1.2.3

### Patch Changes

- 20d5f3a: core package.json fields first in rewrite
- 59350b2: allow copy to dist from parent dirs

## 1.2.2

### Patch Changes

- 753cb22: add "package.json" to exports

## 1.2.1

### Patch Changes

- 2a11cf2: gen package.json exports after name/main

## 1.2.0

### Minor Changes

- 01ee72c: improve generate package.json logic
- 6ecf937: add "singleBuild" config for non-monorepo usage

## 1.1.0

### Minor Changes

- b43bb3a: add "keepDynamicImport" config to allow importing ESM from CommonJS

## 1.0.0

### Major Changes

- b8df666: set bob-esbuild as peer dependency

### Minor Changes

- b989382: allow no tsc target directories

### Patch Changes

- 46b9292: keep custom package.json exports with dist translated
- Updated dependencies [b8df666]
  - bob-esbuild-plugin@1.0.0

## 0.2.4

### Patch Changes

- 582b21f: fix bundle target
- Updated dependencies [582b21f]
  - bob-esbuild-plugin@0.2.4

## 0.2.3

### Patch Changes

- 8e3f251: sourcemap disabled by default
- Updated dependencies [8e3f251]
  - bob-esbuild-plugin@0.2.3

## 0.2.2

### Patch Changes

- 5a92561: fix bin build

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
