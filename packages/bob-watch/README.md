# bob-watch

[![npm](https://img.shields.io/npm/v/bob-watch)](https://npm.im/bob-watch)

Execute commands on start and after every file change in specified directories/files patterns, powered by [Chokidar](https://github.com/paulmillr/chokidar).

The previously specified commands processes are killed before the commands are re-executed, specially useful for APIs.

## Install

```sh
pnpm add -D bob-watch
```

```sh
yarn add -D bob-watch
```

```sh
npm install -D bob-watch
```

## Usage

```
Usage: bob-watch [options]

Options:
  -V, --version                output the version number
  -c, --command <commands...>  Commands to be executed on start and on every change
  -w, --watch <patterns...>    Patterns of directories or files to be watched
  -i, --ignore <patterns...>   Ignore watch patterns
  --quiet                      Prevent non-error logs (default: false)
  -h, --help                   display help for command
```

### Example

```json
{
  "scripts": {
    "dev": "bob-watch -w src -c \"bob-tsm src/index.ts\""
  }
}
```
