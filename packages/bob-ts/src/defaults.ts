export function getDefaultNodeTargetVersion(): `node${string}` {
  const nodeVersion = process.versions.node;

  if (nodeVersion.startsWith('12')) {
    // Check https://github.com/evanw/esbuild/issues/1146
    return 'node13.2';
  }

  return `node${nodeVersion}`;
}
