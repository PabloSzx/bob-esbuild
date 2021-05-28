import colors from "chalk";

export const makeLabel = (input: string, type: "info" | "success" | "error") =>
  colors[type === "info" ? "bgBlue" : type === "error" ? "bgRed" : "bgGreen"](
    colors.black(`[${input.toUpperCase()}]`)
  );
