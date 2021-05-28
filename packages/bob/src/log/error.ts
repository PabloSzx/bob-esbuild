import { makeLabel } from "./label";

export async function error(...message: any[]) {
  console.log(makeLabel("BOB", "error"), ...message);
}
