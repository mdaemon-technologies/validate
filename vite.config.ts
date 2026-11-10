import path from "node:path";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };

const ENTRY = "src/validate.ts";
const OUT_DIR = "dist";

// The bundle paths come from package.json, which consumers resolve them through.
const BUNDLES: Record<string, string> = {
  es: pkg.module,
  cjs: pkg.common,
  umd: pkg.browser
};

// Bundles the type declarations into one self-contained file per module system.
// The package is "type": "module", so a .d.ts is read as ESM; CommonJS consumers
// need the .d.cts copy. Vite has no equivalent of rollup-plugin-dts, so this runs
// it through Rollup's API. It hooks the ES output's writeBundle, which runs once
// per (re)build and not at all when the build fails.
function bundledDeclarations(): Plugin {
  return {
    name: "bundled-declarations",
    apply: "build",
    async writeBundle(options) {
      if (options.format !== "es") {
        return;
      }
      const bundle = await rollup({ input: ENTRY, plugins: [dts({ tsconfig: "./tsconfig.build.json" })] });
      try {
        for (const file of ["index.d.ts", "index.d.cts"]) {
          await bundle.write({ file: path.join(OUT_DIR, file), format: "es" });
        }
      } finally {
        await bundle.close();
      }
    }
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [bundledDeclarations()],
  build: {
    outDir: OUT_DIR,
    // dist/ also holds the hand-written per-bundle declaration shims.
    emptyOutDir: false,
    target: "es2020",
    lib: {
      entry: ENTRY,
      name: "validate",
      formats: ["es", "cjs", "umd"],
      fileName: format => path.posix.relative(OUT_DIR, BUNDLES[format])
    },
    rolldownOptions: {
      output: {
        exports: "named",
        // Library mode leaves ES output unminified; minify it like the CJS and UMD bundles.
        minify: true,
        // Keep the CJS and UMD bundles strict, as the TypeScript modules are.
        strict: true,
        // Keep the CJS and UMD exports a plain object, without a [object Module] tag.
        generatedCode: { symbols: false }
      }
    }
  }
});
