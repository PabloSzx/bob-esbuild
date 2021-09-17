import { promises } from 'fs';
import { resolve } from 'path';

export const getPackageJson = async () => {
  const packageJsonString = await promises.readFile(resolve('./package.json'), { encoding: 'utf-8' });

  return JSON.parse(packageJsonString) as {
    type?: string;
  };
};
