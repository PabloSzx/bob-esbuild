export async function retry<T>(cb: () => Promise<T>, times: number = 3) {
  for (let i = 0; i < times - 1; ++i) {
    try {
      const value = await cb();

      return value;
    } catch (err) {}
  }

  try {
    const value = await cb();

    return value;
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, retry);

    throw err;
  }
}
