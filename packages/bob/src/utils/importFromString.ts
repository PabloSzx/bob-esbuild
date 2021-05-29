import path from "path";
import Module from "module";

// https://github.com/floatdrop/require-from-string/blob/master/index.js
export function importFromString(
  code: string,
  filename: string,
  opts: { appendPaths?: string[]; prependPaths?: string[] } = {}
) {
  const appendPaths = opts.appendPaths || [];
  const prependPaths = opts.prependPaths || [];

  // @ts-expect-error
  const paths = Module._nodeModulePaths(path.dirname(filename));

  const m = new Module(filename);
  m.filename = filename;
  m.paths = [...prependPaths, ...paths, ...appendPaths];
  // @ts-expect-error
  m._compile(code, filename);

  const exports = m.exports;

  return exports;
}
