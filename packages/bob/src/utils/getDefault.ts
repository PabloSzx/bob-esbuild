export function getDefault<T>(v: T | { default?: T }) {
  return (('default' in v ? v.default : v) || v) as T;
}
