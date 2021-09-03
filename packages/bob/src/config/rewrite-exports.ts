export function rewriteExports(
  exports: Record<string, string | { require?: string; import?: string }>,
  withoutDistDir: (str: string) => string | undefined
) {
  const newExports = { ...exports };

  newExports['./package.json'] = './package.json';

  if (!newExports['.']) throw Error('No "." specified in "exports"');

  for (const [key, value] of Object.entries(newExports)) {
    if (!value) continue;

    let newValue = value as string | { require?: string; import?: string };

    if (typeof newValue === 'string') {
      newValue = withoutDistDir(newValue)!;
    } else if (typeof newValue === 'object' && newValue != null) {
      newValue = {
        require: newValue.require != null ? withoutDistDir(newValue.require) : undefined,
        import: newValue.import != null ? withoutDistDir(newValue.import) : undefined,
      };
    }

    newExports[withoutDistDir(key)!] = newValue;
  }

  return newExports;
}
