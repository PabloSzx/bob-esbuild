# bob-esbuild

This library is recommended to be used with [pnpm](https://pnpm.io/), but it's not a requirement and it should to work with package manager.

This library is focused into monorepo projects, and all the instructions are going to be focused on that usage.

## Install

If you are using it in a monorepo project, you have to install it in your root like this:

```sh
pnpm add bob-esbuild bob-esbuild-cli
```

Then, in every package you want to build with `bob-esbuild`, you can simply install `bob-esbuild-cli`:

```sh
pnpm add bob-esbuild-cli
```

## Usage

In your root, you have to make a file called `bob-esbuild.config.ts`, and it's body should be like this:

```ts
export const config: import("bob-esbuild").BobConfig = {
  tsc: {
    dirs: ["packages/*"],
  },
  verbose: true,
};
```

You can use all the typescript auto-completion and type-safety to inspect all the possible options.

But a required configuration is to specify the `tsc.dirs` with the pattern of directories you want to add the types to.

In every package you want to build, you have to specify in every package.json:

```json
{
  "prepack": "bob-esbuild build"
}
```

Or, if you want to build it alongside in the monorepo setup:

```json
{
  "prepare": "bob-esbuild build"
}
```

Then in your root monorepo a recommended build script would be something like this:

```json
{
  "scripts": {
    "build": "bob-esbuild tsc && pnpm prepack -r"
  }
}
```

And it will pre-build the types, and call the "prepack" script in every package in your monorepo.

## ESM Support

This library is focused on giving first-class support for Node.js ESM, and for that reason, it always builds a `.js` file for CommonJS, alongside a `.mjs` file for ESM.

In every package you build for, you have to specify the package.json fields like this:

> This also enables to import every module separately

```json
{
  "main": "lib/index.js",
  "module": "lib/index.mjs",
  "types": "lib/index.d.ts",
  "exports": {
    ".": {
      "require": "./lib/index.js",
      "import": "./lib/index.mjs"
    },
    "./*": {
      "require": "./*.js",
      "import": "./*.mjs"
    }
  }
}
```

## Why "lib" directory is enforced over "dist"?

The reason is relatively simple:

Due to lack of support of TypeScript for package.json exports ([Check this issue](https://github.com/microsoft/TypeScript/issues/33079)) to be able to import deep modules, the only good workaround is to just specify all the path inside the package, and if we are using `lib`, that results in something like this:

```ts
import { Hello } from "your-package/lib/bar/baz";
```

And if using `dist`, it would look something like this, and please be honest to yourself, this looks like we are doing something wrong, and it gives the impression that import from "dist" is not correct (and its also a longer and uglier path 😝):

```ts
import { Hello } from "your-package/dist/bar/baz";
```

### typesVersions workaround

The `typesVersions` workaround kills TypeScript detection of the top-level entry, [check this issue](https://github.com/teppeis/typescript-subpath-exports-workaround/issues/1).

If your package **doesn't have a top-level entry**, you are free to use:

```json
{
  "typesVersions": {
    "*": {
      "*": ["lib/*"]
    }
  }
}
```

## tsconfig

`bob-esbuild` enforces specifying a couple of options in your root tsconfig, and it will error out if you are not doing it:

```json
{
  "compilerOptions": {
    "outDir": "<any-name-you-like>",
    "rootDir": "."
  }
}
```

And it's recommended to use `tsconfig` paths & baseUrl, check [the official docs](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) about it.
