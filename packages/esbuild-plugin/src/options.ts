import { parse, TSConfckParseResult } from 'tsconfck';

const cache = new Map<string, TSConfckParseResult>();

export const getTypescriptConfig = async (
  cwd: string,
  tsconfig?: string
): Promise<{ jsxFactory?: string; jsxFragment?: string; target?: string }> => {
  const config = await parse(tsconfig || cwd, {
    cache,
  });

  const { jsxFactory, jsxFragmentFactory, target } = config.tsconfig.compilerOptions || {};
  return {
    jsxFactory,
    jsxFragment: jsxFragmentFactory,
    target: target && target.toLowerCase(),
  };
};
