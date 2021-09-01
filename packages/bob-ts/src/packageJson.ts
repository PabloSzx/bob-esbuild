import { promises } from 'fs';

export const getPackageJson = async () => {
  const packageJsonString = await promises.readFile('./package.json', { encoding: 'utf-8' });

  return JSON.parse(packageJsonString) as {
    type?: string;
  };
};
