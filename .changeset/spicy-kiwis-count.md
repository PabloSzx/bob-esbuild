---
'bob-tsm': minor
---

- New option `--node-env` / `--node_env` to automatically add the specified option as `NODE_ENV` environment variable, `"prod"` is an alias for "production" and `"dev"` is an alias for "development". For example: `bob-tsm --node-env=dev --watch=src src/index.ts` or `bob-tsm --node-env=prod src/index.ts`
- Automatically add `--enable-source-maps` flag
- Fix `--tsmconfig` and `--quiet` usage
- Watch mode prints what file paths have changed and caused the re-execution, you can use `--quiet` or `-q` to silence them.
