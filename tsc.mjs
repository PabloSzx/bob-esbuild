import { buildTsc } from "bob-esbuild";

buildTsc(["examples/basic", "examples/depended"]).catch(console.error);
