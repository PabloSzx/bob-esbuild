export interface TSCOptions {
  dirs?: string[];

  /**
   * @default "tsc --emitDeclarationOnly"
   */
  tscBuildCommand?: string;

  /**
   * Target directory
   * @default "lib"
   */
  typesTarget?: string;
}
