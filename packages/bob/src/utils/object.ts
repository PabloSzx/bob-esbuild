export function cleanObject<T extends object>(obj: Partial<T> = {}): Partial<T> {
  const clean = { ...obj };
  for (const key in clean) clean[key] === undefined && delete clean[key];
  return clean;
}
