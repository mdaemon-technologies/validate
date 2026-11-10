/**
 * Checks the published type declarations. Requires a fresh `npm run build`.
 *
 * The fixtures type-check the declarations the way consumers resolve them:
 * through the package "exports" map (self-reference), as both a CommonJS (.cts)
 * and an ES module (.mts) consumer. The declaration files themselves are then
 * pinned to exactly the public API, with no `any` in exported signatures.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
// TypeScript 7 (the native compiler) has no JavaScript compiler API, so the
// checks below use the official compatibility package, which provides the
// TypeScript 6 API. The fixtures are also compiled by TypeScript 7's own tsc.
import ts from "@typescript/typescript6";
import { describe, expect, it } from "vitest";
import { NAMED_EXPORTS, TYPE_EXPORTS } from "../test-types/public-api";

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = path.join(ROOT, "dist");
const DECLARATION_FILES = ["index.d.ts", "index.d.cts"];

const compilerOptions: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.Node16,
  moduleResolution: ts.ModuleResolutionKind.Node16,
  types: []
};

function typeCheck(fixture: string): string[] {
  const file = path.join(ROOT, "test-types", fixture);
  const program = ts.createProgram([file], compilerOptions);
  return ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

function declarationExports(file: string): { checker: ts.TypeChecker; exports: ts.Symbol[] } {
  const fullPath = path.join(DIST, file);
  const program = ts.createProgram([fullPath], compilerOptions);
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(fullPath)!)!;
  return { checker, exports: checker.getExportsOfModule(moduleSymbol) };
}

// Exported functions whose parameters or return type are `any`.
function looselyTyped({ checker, exports }: ReturnType<typeof declarationExports>): string[] {
  const loose: string[] = [];
  for (const symbol of exports) {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    if (!(target.flags & ts.SymbolFlags.Function)) {
      continue;
    }
    for (const signature of checker.getTypeOfSymbol(target).getCallSignatures()) {
      if (signature.getReturnType().flags & ts.TypeFlags.Any) {
        loose.push(`${symbol.name}: return`);
      }
      for (const parameter of signature.getParameters()) {
        if (checker.getTypeOfSymbol(parameter).flags & ts.TypeFlags.Any) {
          loose.push(`${symbol.name}: ${parameter.name}`);
        }
      }
    }
  }
  return loose;
}

describe("published type declarations", () => {
  it("type-check for a CommonJS consumer", () => {
    expect(typeCheck("consumer.cts")).toEqual([]);
  }, 30000);

  it("type-check for an ES module consumer", () => {
    expect(typeCheck("consumer.mts")).toEqual([]);
  }, 30000);

  it("still compile code written against the 3.4.0 declarations, apart from the 4.0.0 change", () => {
    expect(typeCheck("compat-3.4.mts")).toEqual([]);
  }, 30000);

  // @typescript/typescript6 installs TypeScript 6 as @typescript/old, whose
  // `tsc` bin can win node_modules/.bin/tsc. The scripts must name TypeScript
  // 7's own bin, so the build and `npm run typecheck` really use TypeScript 7.
  it.each(["typecheck", "typecheck:build"])("npm run %s uses TypeScript 7", script => {
    const output = execSync(`npm run --silent ${script} -- --version`, { cwd: ROOT, encoding: "utf8", timeout: 50000 });
    expect(output.trim()).toMatch(/^Version 7\./);
  }, 60000);

  // The same fixtures, compiled by the native TypeScript 7 compiler that
  // consumers on TypeScript 7 use (test-types/tsconfig.json).
  it("type-check for every fixture with TypeScript 7's tsc", () => {
    const pkg = require("typescript/package.json");
    const tsc = path.join(path.dirname(require.resolve("typescript/package.json")), pkg.bin.tsc);
    // A timeout: Vitest's own cannot interrupt a synchronous spawn.
    const result = spawnSync(process.execPath, [tsc, "-p", path.join(ROOT, "test-types", "tsconfig.json")], {
      encoding: "utf8",
      timeout: 50000
    });
    expect(pkg.version).toMatch(/^7\./);
    expect(result.stdout + result.stderr).toBe("");
    expect(result.status).toBe(0);
  }, 60000);

  it("are identical for both module systems", () => {
    const [esm, cjs] = DECLARATION_FILES.map(file => fs.readFileSync(path.join(DIST, file), "utf8"));
    expect(cjs).toBe(esm);
  });

  describe.each(DECLARATION_FILES)("%s", file => {
    it("exports exactly the public API", () => {
      const names = declarationExports(file).exports.map(symbol => symbol.name).sort();
      expect(names).toEqual([...NAMED_EXPORTS, ...TYPE_EXPORTS, "default"].sort());
    }, 30000);

    it("types no exported function parameter or return as any", () => {
      expect(looselyTyped(declarationExports(file))).toEqual([]);
    }, 30000);

    // Each declaration file ships on its own, so it must not reference sibling files.
    it("is self-contained", () => {
      const text = fs.readFileSync(path.join(DIST, file), "utf8");
      expect(text).not.toMatch(/(?:from\s+|import\s*\(|require\s*\(|import\s+|reference\s+path=)["']\.\.?\//);
    });
  });
});
