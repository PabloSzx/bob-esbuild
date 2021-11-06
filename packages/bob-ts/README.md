# bob-ts

[![npm](https://img.shields.io/npm/v/bob-ts)](https://npm.im/bob-ts)

Transpile your **TypeScript** projects quickly using **esbuild** + **rollup**, made to accelerate and simplify the TypeScript development with file watcher and first-class support for JavaScript testing frameworks.

> This library doesn't handle type definitions, but you can add them simply by doing `tsc --declaration --emitDeclarationOnly`

## Install

```sh
pnpm add -D bob-ts esbuild
```

```sh
yarn add -D bob-ts esbuild
```

```sh
npm install -D bob-ts esbuild
```

## Usage

By default `bob-ts` is ESM first, but you can change it to be either CJS with: `-f cjs` or `-f interop` to transpile for both **CommonJS** & **ESM**.

If you **don't** have `"type": "module"` in your `package.json`, `ESM` will be outputted with the extension `.mjs` and `CJS` as `.js`

If you **do** have `"type": "module"` in your `package.json`, `ESM` will be outputted with the extension `.js` and `CJS` as `.cjs`.

### Build

```
Usage: bob-ts [options]

Options:
  -d, --dir <directory>      Custom output dir (default: "dist")
  -i, --input <patterns...>  Input patterns (default: ".")
  -f, --format <format>      Format, it can be 'cjs', 'esm' or 'interop' (default: "esm")
  --cwd <dir>                Custom target directory (default: "X")
  --no-clean                 Don't clean output dir (default: true)
  -t, --target <target>      Javascript runtime target (default: "_YOUR_CURRENT_NODE_VERSION_")
  --no-sourcemap             Disable sourcemap generation
  --paths                    Resolve tsconfig paths (default: false)
  -h, --help                 display help for command
```

> This will transpile all your `src` folder, and its structure will be kept **as is** in the `dist` folder

```json
{
  "scripts": {
    "prepare": "bob-ts -i src"
  }
}
```

### Development / Watch Mode

```
Usage: bob-ts-watch [options]

Options:
  -d, --dir <directory>        Custom output dir (default: "dist")
  -i, --input <patterns...>    Input patterns (default: ".")
  -f, --format <format>        Output format (choices: "cjs", "esm", "interop", default: "esm")
  --clean                      Clean output dir (default: false)
  --cwd <dir>                  Custom target directory (default: "___")
  -c, --command <commands...>  Execute scripts after successful JS build, You can specify more than a single command
                               to be executed concurrently
  -t, --target <target>        Javascript runtime target (default: "_YOUR_CURRENT_NODE_VERSION_")
  --ignore <files...>          Patterns of files to ignore watching
  --no-sourcemap               Disable sourcemap generation
  --paths                      Resolve tsconfig paths (default: false)
  -h, --help                   display help for command
```

```json
{
  "scripts": {
    "dev": "bob-ts-watch -i src -c \"node dist/index.mjs\""
  }
}
```

## Usage with Testing

The main reason for the default input being `"."` is because this library has first-class support for being used for JavaScript test frameworks like [Mocha](https://mochajs.org/) and [Node-Tap](https://node-tap.org/).

You can have all the tests files inside a specific test directory, for example, `test`, and use the transpiled version of your code with all the required source maps.

In the end, a better and faster alternative than `ts-node/register`, and the solution for **ESM support** with TypeScript, where `ts-node` struggles a lot.

> Example structure

```
src/
  index.ts
test/
  main.test.ts
package.json
```

### Mocha

```sh
pnpm add -D mocha c8
```

```sh
yarn add -D mocha c8
```

```sh
npm install -D mocha c8
```

#### ESM

```json
{
  "scripts": {
    "dev": "bob-ts-watch -c \"node/dist/src/index.mjs\"",
    "start": "bob-ts && node/dist/src/index.mjs",
    "test": "bob-ts && c8 mocha dist/test",
    "test:watch": "bob-ts-watch -c \"c8 mocha dist/test\""
  },
  "mocha": {
    "enable-source-maps": true
  }
}
```

#### CJS

```json
{
  "scripts": {
    "dev": "bob-ts-watch -f cjs -c \"node dist/src/index.js\"",
    "start": "bob-ts -f cjs && node dist/src/index.js",
    "test": "bob-ts -f cjs && c8 mocha dist/test",
    "test:watch": "bob-ts-watch -f cjs -c \"c8 mocha dist/test\""
  },
  "mocha": {
    "enable-source-maps": true
  }
}
```

### Node Tap

```sh
pnpm add -D tap @istanbuljs/esm-loader-hook
```

```sh
yarn add -D tap @istanbuljs/esm-loader-hook
```

```sh
npm install -D tap @istanbuljs/esm-loader-hook
```

#### ESM

> Assuming that your tests are inside a `test` directory

```json
{
  "scripts": {
    "dev": "bob-ts-watch -c \"node/dist/src/index.mjs\"",
    "start": "bob-ts && node/dist/src/index.mjs",
    "test": "bob-ts && tap dist/test",
    "test:watch": "bob-ts-watch -c \"tap dist/test\""
  },
  "tap": {
    "node-arg": ["--no-warnings", "--experimental-loader", "@istanbuljs/esm-loader-hook"]
  }
}
```

#### CJS

```json
{
  "scripts": {
    "dev": "bob-ts-watch -f cjs -c \"node/dist/src/index.js\"",
    "start": "bob-ts -f cjs && node/dist/src/index.js",
    "test": "bob-ts -f cjs && tap dist/test",
    "test:watch": "bob-ts-watch -f cjs -c \"tap dist/test\""
  }
}
```

## LICENSE

MIT
