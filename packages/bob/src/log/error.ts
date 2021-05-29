import { makeLabel } from "./label";

export async function error(...message: any[]) {
  console.error(makeLabel("BOB", "error"), ...message);
}
