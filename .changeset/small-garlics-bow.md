---
'bob-tsm': patch
---

Remove "--loader" from `process.execArgv` to fix applications that rely on forked Node.js sub-processes like Next.js Custom Server, you can opt-out specifying "KEEP_LOADER_ARGV" environment variable.
