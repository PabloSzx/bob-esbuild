import { default as rollupJson } from '@rollup/plugin-json';
import { Option, program } from 'commander';
import { globby } from 'globby';
import { default as del } from 'rollup-plugin-delete';
import { default as externals } from 'rollup-plugin-node-externals';
import { default as tsconfigPaths } from 'rollup-plugin-tsconfig-paths';

export { program, Option, globby, del, tsconfigPaths, rollupJson, externals };
