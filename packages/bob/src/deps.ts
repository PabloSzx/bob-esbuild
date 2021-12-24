import { default as makePublishManifest } from '@pnpm/exportable-manifest';
import { default as rollupJson } from '@rollup/plugin-json';
import { default as colors } from 'chalk';
import { default as format } from 'date-fns/format/index.js';
import fsExtra from 'fs-extra';
import { default as get } from 'lodash.get';
import { default as del } from 'rollup-plugin-delete';
import { default as externals } from 'rollup-plugin-node-externals';
import { default as tsconfigPaths } from 'rollup-plugin-tsconfig-paths';
import { default as treeKill } from 'tree-kill';
import { parse as parseTsconfig } from 'tsconfck';

export { cosmiconfig } from 'cosmiconfig';
export { execaCommand as command } from 'execa';
export { hashElement } from 'folder-hash';
export { globby } from 'globby';
export { format, makePublishManifest, colors, get, del, externals, tsconfigPaths, treeKill, parseTsconfig, rollupJson };

export const { copyFile, mkdirp, pathExists, readJSON, writeJSON, copy, ensureDir } = fsExtra;
