import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Read the main package.json
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));

// Create a minimal package.json for dist/
const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  main: "geometry.umd.js",
  module: "geometry.es.js",
  types: "../dist/index.d.ts",
  exports: {
    ".": {
      import: "./geometry.es.js",
      require: "./geometry.umd.js",
    },
  },
};

// Write to dist/package.json
writeFileSync(resolve("dist/package.json"), JSON.stringify(distPackageJson, null, 2));

console.log("✅ Created dist/package.json");
