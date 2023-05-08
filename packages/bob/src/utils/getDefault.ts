export function getDefault<T>(v: T | { default?: T }) {
  return ((typeof v === 'object' && v != null && 'default' in v ? v.default : v) || v) as T;
}
