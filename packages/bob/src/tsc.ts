import { execSync } from "child_process";
import { copy } from "fs-extra";
import globby from "globby";
import { parse, resolve } from "path";

export interface BuildTscOptions {
  dirs: string[];
  log?: (...message: any[]) => void;
  /**
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * @default "tsc --emitDeclarationOnly"
   */
  tscCommand?: string;
  /**
   * Types source, relative to `cwd`
   * @default "types"
   */
  typesSource?: string;
  /**
   * Target directory
   * @default "lib"
   */
  typesTarget?: string;
}

export async function buildTsc({
  dirs,
  log = console.log,
  cwd = process.cwd(),
  tscCommand = "tsc --emitDeclarationOnly",
  typesSource = "types",
  typesTarget = "lib",
}: BuildTscOptions) {
  const targetDirs = await globby(dirs, {
    expandDirectories: false,
    absolute: false,
    onlyDirectories: true,
    cwd,
  });

  log("Building types for: " + targetDirs.join(" | "));

  execSync(tscCommand, {
    stdio: "inherit",
    cwd,
  });

  await Promise.all(
    targetDirs.map(async (dir) => {
      await copy(resolve(cwd, `${typesSource}/${dir}/src`), resolve(cwd, `${dir}/${typesTarget}`), {
        filter(src) {
          // Check if is directory
          if (!parse(src).ext) return true;

          return src.endsWith(".d.ts");
        },
      });
    })
  );
}
