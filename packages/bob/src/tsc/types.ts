export interface TSCOptions {
  dirs?: string[];

  /**
   * @default "tsc --emitDeclarationOnly"
   */
  tscBuildCommand?: string;
}
