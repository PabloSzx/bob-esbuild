import { createExportableManifest } from '@pnpm/exportable-manifest';
export { default as rollupJson } from '@rollup/plugin-json';
export { default as colors } from 'chalk';
export { cosmiconfig } from 'cosmiconfig';
export { format } from 'date-fns/format';
export { execaCommand as command } from 'execa';
export { hashElement } from 'folder-hash';
export { globby } from 'globby';
export { default as get } from 'lodash.get';
export { default as del } from 'rollup-plugin-delete';
export { default as externals } from 'rollup-plugin-node-externals';
export { default as tsconfigPaths } from 'rollup-plugin-tsconfig-paths';
export { default as treeKill } from 'tree-kill';
export { parse as parseTsconfig } from 'tsconfck';

import fsExtra from 'fs-extra';

export const makePublishManifest = createExportableManifest;

export const { copyFile, mkdirp, pathExists, copy, ensureDir } = fsExtra;

export const readJSON: (path: string) => Promise<unknown> = fsExtra.readJSON;
export const writeJSON: (path: string, content: unknown, options?: { spaces?: number }) => Promise<unknown> = fsExtra.writeJSON;
