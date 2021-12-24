export declare const tsconfigPathsHandler:
  | ((request: string, importer: string) => string | undefined)
  | Promise<(request: string, importer: string) => string | undefined>
  | undefined;
