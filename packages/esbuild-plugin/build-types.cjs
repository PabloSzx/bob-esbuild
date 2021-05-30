const { buildTsc } = require("../bob/src/tsc/build.ts");

buildTsc().catch((err) => {
  console.error(err);
  process.exit(1);
});
