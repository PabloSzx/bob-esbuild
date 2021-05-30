# bob-esbuild

Is recommended to be used with [pnpm](https://pnpm.io/), but it's not a requirement and it should to work with any package manager.

This library is primarily focused into monorepo projects, and all the instructions are going to be focused on that usage.

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
export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*'],
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

> You can also change the "dist" folder to any name, you only have to be consistent and change it in your root configuration in the field "distDir"

> This also enables to import every module separately

```json
{
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    },
    "./*": {
      "require": "./dist/*.js",
      "import": "./dist/*.mjs"
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
