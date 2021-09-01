# bob-ts

Transpile your **TypeScript** projects quickly using **esbuild** + **rollup**, made to accelerate and simplify the TypeScript development with watcher and first class support for JavaScript testing frameworks.

> This library doesn't handle type definitions, but you can add them simply doing `tsc --declaration --emitDeclarationOnly`

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
  --cwd <dir>                Custom target directory (default: "__current_directory__")
  --no-clean                 No clean output dir (default: true)
  -h, --help                 display help for **command**
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
  -d, --dir <directory>      Custom output dir (default: "dist")
  -i, --input <patterns...>  Input patterns (default: ".")
  -f, --format <format>      Format, it can be 'cjs', 'esm' or 'interop' (default: "esm")
  --no-clean                 No clean output dir (default: true)
  --cwd <dir>                Custom target directory (default: "__current_directory__")
  -c, --command <cmd>        Execute script after successful JS build
  -h, --help                 display help for command
```

```json
{
  "scripts": {
    "dev": "bob-ts-watch -i src -c \"node dist/index.mjs\""
  }
}
```

### Usage with Testing

The primary reason that for the default input being `"."` is because this library has primary support for being used for JavaScript test frameworks like [Mocha](https://mochajs.org/) and [Node-Tap](https://node-tap.org/), and having all the tests files inside an specific test directory, for example, `test`, and simply executing the transpiled version of your tests with all the sourcemaps, being a better and faster alternative than `ts-node/register`, specially for **ESM support**, which `ts-node` struggles with.

> Example structure

```
src/
  index.ts
test/
  main.test.ts
package.json
```

## Mocha

```sh
pnpm add -D mocha nyc @istanbuljs/esm-loader-hook
```

```sh
yarn add -D mocha nyc @istanbuljs/esm-loader-hook
```

```sh
npm install -D mocha nyc @istanbuljs/esm-loader-hook
```

### ESM

```json
{
  "scripts": {
    "dev": "bob-ts-watch -c \"node/dist/src/index.mjs\"",
    "start": "bob-ts && node/dist/src/index.mjs",
    "test": "bob-ts && nyc mocha dist/test",
    "test:watch": "bob-ts-watch -c \"nyc mocha dist/test\""
  },
  "mocha": {
    "enable-source-maps": true,
    "no-warnings": true,
    "experimental-loader": "@istanbuljs/esm-loader-hook"
  }
}
```

### CJS

```json
{
  "scripts": {
    "dev": "bob-ts-watch -f cjs -c \"node dist/src/index.js\"",
    "start": "bob-ts -f cjs && node dist/src/index.js",
    "test": "bob-ts -f cjs && nyc mocha dist/test",
    "test:watch": "bob-ts-watch -f cjs -c \"nyc mocha dist/test\""
  },
  "mocha": {
    "enable-source-maps": true
  }
}
```

## Node Tap

```sh
pnpm add -D tap @istanbuljs/esm-loader-hook
```

```sh
yarn add -D tap @istanbuljs/esm-loader-hook
```

```sh
npm install -D tap @istanbuljs/esm-loader-hook
```

### ESM

> Assumming that your tests are inside a `test` directory

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

### CJS

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
