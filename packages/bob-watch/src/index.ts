import { watch, FSWatcher } from 'chokidar';

export function StartWatcher({
  paths,
  ignored,
}: {
  paths: string[];
  ignored?: string[];
  commands?: string[];
  callbacks?: string[];
  quiet?: boolean;
}) {
  const watcher: FSWatcher = watch(paths, {
    ignored,
  });

  return {
    watcher,
  };
}
