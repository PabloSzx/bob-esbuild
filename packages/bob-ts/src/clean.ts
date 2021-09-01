import { promises } from 'fs';
import { join } from 'path';

export async function cleanEmptyFoldersRecursively(folder: string) {
  const isDir = (await promises.stat(folder)).isDirectory();
  if (!isDir) return;

  let files = await promises.readdir(folder);

  if (files.length > 0) {
    await Promise.all(
      files.map(file => {
        const fullPath = join(folder, file);
        return cleanEmptyFoldersRecursively(fullPath);
      })
    );

    // re-evaluate files; after deleting subfolder
    // we may have parent folder empty now
    files = await promises.readdir(folder);
  }

  if (files.length == 0) {
    await promises.rmdir(folder);
    return;
  }
}
