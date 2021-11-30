export function getDefaultNodeTargetVersion(): `node${string}` {
  return `node${process.versions.node}`;
}
