import { default as makePublishManifestPkg } from '@pnpm/exportable-manifest';
import fsExtra from 'fs-extra';
import { getDefault } from './utils/getDefault';
export { default as rollupJson } from '@rollup/plugin-json';
export { default as colors } from 'chalk';
export { cosmiconfig } from 'cosmiconfig';
export { default as format } from 'date-fns/format/index.js';
export { execaCommand as command } from 'execa';
export { hashElement } from 'folder-hash';
export { globby } from 'globby';
export { default as get } from 'lodash.get';
export { default as del } from 'rollup-plugin-delete';
export { default as externals } from 'rollup-plugin-node-externals';
export { default as tsconfigPaths } from 'rollup-plugin-tsconfig-paths';
export { default as treeKill } from 'tree-kill';
export { parse as parseTsconfig } from 'tsconfck';

export const makePublishManifest = getDefault(makePublishManifestPkg);

export const { copyFile, mkdirp, pathExists, readJSON, writeJSON, copy, ensureDir } = fsExtra;
