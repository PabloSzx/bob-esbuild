---
'bob-tsm': minor
---

New "--paths" CLI option to enable [tsconfig paths](https://www.typescriptlang.org/tsconfig#paths) mapping resolution. The `tsconfig.json` location by default is where `bob-tsm` is called, but it can be customized using the `TS_NODE_PROJECT` environment variable. This mapping is used as a fallback over the default Node.js + Default TypeScript path resolution.
