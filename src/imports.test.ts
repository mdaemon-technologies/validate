/**
 * Tests that verify the built dist files export correctly
 * for all documented import/require patterns. Requires a fresh `npm run build`.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { types } from "node:util";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { DEFAULT_ALIASES, NAMED_EXPORTS } from "../test-types/public-api";

const require = createRequire(import.meta.url);
const DIST = new URL("../dist/", import.meta.url);

// The package is "type": "module", so Node would load validate.umd.js as ESM.
// Run it as a classic script instead, the way a UMD loader or <script> tag does.
function runUmd(sandbox: Record<string, unknown>): void {
  const file = fileURLToPath(new URL("validate.umd.js", DIST));
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
}

function loadUmdAsCommonJs(): any {
  const module = { exports: {} };
  runUmd({ module, exports: module.exports });
  return module.exports;
}

describe("dist", () => {
  // The build must neither delete the hand-written per-bundle declaration shims
  // nor leave extra files behind.
  it("contains exactly the published files", () => {
    expect(fs.readdirSync(DIST).sort()).toEqual([
      "index.d.cts",
      "index.d.ts",
      "validate.cjs",
      "validate.cjs.d.ts",
      "validate.mjs",
      "validate.mjs.d.ts",
      "validate.umd.d.ts",
      "validate.umd.js"
    ]);
  });
});

describe.each(["validate.cjs", "validate.umd.js"])("%s", file => {
  // TypeScript modules are strict, so the non-ES bundles must keep them strict.
  it("runs in strict mode", () => {
    expect(fs.readFileSync(new URL(file, DIST), "utf8").slice(0, 13)).toBe('"use strict";');
  });

  // The exports object is a plain object, as it was in 4.0.0, not tagged [object Module].
  it("exports a plain object", () => {
    const exported = file === "validate.cjs" ? require("../dist/validate.cjs") : loadUmdAsCommonJs();
    expect(Object.prototype.toString.call(exported)).toBe("[object Object]");
  });
});

describe("ESM build (dist/validate.mjs)", () => {
  it("exports exactly the public API, with the aliases on the default object", async () => {
    const esm = await import(/* @vite-ignore */ new URL("validate.mjs", DIST).href);
    // vitest.config.ts externalizes the bundles, so Node's own loader evaluates
    // this one and returns a real module namespace, not a Vite-transformed copy.
    expect(types.isModuleNamespaceObject(esm)).toBe(true);
    expect(Object.keys(esm).filter(key => key !== "default").sort()).toEqual(NAMED_EXPORTS);
    expect(Object.keys(esm.default).sort()).toEqual(Object.keys(DEFAULT_ALIASES).sort());
    for (const [alias, name] of Object.entries(DEFAULT_ALIASES)) {
      expect(esm.default[alias]).toBe(esm[name]);
    }
  });

  it("validates", async () => {
    const { default: validate, validateEmailAddress } = await import(/* @vite-ignore */ new URL("validate.mjs", DIST).href);
    expect(validate.domain("example.com")).toBe(true);
    expect(validate.domain("invalid")).toBe(false);
    expect(validateEmailAddress("user@example.com")).toBe(true);
  });
});

describe("CJS build (dist/validate.cjs)", () => {
  const cjsModule = require("../dist/validate.cjs");

  it("exposes .default as the validate convenience object", () => {
    expect(cjsModule.default).toBeDefined();
    expect(typeof cjsModule.default.domain).toBe("function");
    expect(typeof cjsModule.default.email).toBe("function");
    expect(typeof cjsModule.default.ip).toBe("function");
    expect(typeof cjsModule.default.ipv4).toBe("function");
    expect(typeof cjsModule.default.ipv6).toBe("function");
    expect(typeof cjsModule.default.ldapDN).toBe("function");
    expect(typeof cjsModule.default.windowsFileName).toBe("function");
    expect(typeof cjsModule.default.windowsPath).toBe("function");
    expect(typeof cjsModule.default.createSchemaValidator).toBe("function");
  });

  it("default export works for validation", () => {
    const validate = cjsModule.default;
    expect(validate.domain("example.com")).toBe(true);
    expect(validate.domain("invalid")).toBe(false);
    expect(validate.email("user@example.com")).toBe(true);
    expect(validate.email("notanemail")).toBe(false);
  });

  it("exposes named exports directly on the module", () => {
    expect(typeof cjsModule.validateDomain).toBe("function");
    expect(typeof cjsModule.validateEmailAddress).toBe("function");
    expect(typeof cjsModule.validateIPAddress).toBe("function");
    expect(typeof cjsModule.validateIPv4).toBe("function");
    expect(typeof cjsModule.validateIPv6).toBe("function");
    expect(typeof cjsModule.validateInt).toBe("function");
    expect(typeof cjsModule.validateLdapDN).toBe("function");
    expect(typeof cjsModule.validateWindowsFileName).toBe("function");
    expect(typeof cjsModule.validateWindowsPath).toBe("function");
    expect(typeof cjsModule.validatePassword).toBe("function");
    expect(typeof cjsModule.isValidPassword).toBe("function");
    expect(typeof cjsModule.createSchemaValidator).toBe("function");
    expect(typeof cjsModule.hasUpperCase).toBe("function");
    expect(typeof cjsModule.hasLowerCase).toBe("function");
    expect(typeof cjsModule.hasNumber).toBe("function");
    expect(typeof cjsModule.hasSpecial).toBe("function");
  });

  it("named exports work for validation", () => {
    const { validateDomain, validateEmailAddress } = cjsModule;
    expect(validateDomain("example.com")).toBe(true);
    expect(validateDomain("invalid")).toBe(false);
    expect(validateEmailAddress("user@example.com")).toBe(true);
    expect(validateEmailAddress("notanemail")).toBe(false);
  });
});

describe("UMD build (dist/validate.umd.js) as a browser global", () => {
  const window: Record<string, any> = {};
  runUmd(window);

  it("defines window.validate with the convenience object on .default", () => {
    expect(typeof window.validate.default.domain).toBe("function");
    expect(window.validate.default.domain("example.com")).toBe(true);
    expect(window.validate.default.email("notanemail")).toBe(false);
  });

  it("defines the named exports on window.validate", () => {
    expect(window.validate.validateDomain("example.com")).toBe(true);
    expect(window.validate.validateEmailAddress("user@example.com")).toBe(true);
  });
});

describe("UMD build (dist/validate.umd.js) through a CommonJS loader", () => {
  const umdModule = loadUmdAsCommonJs();

  it("exposes .default as the validate convenience object", () => {
    expect(umdModule.default).toBeDefined();
    expect(typeof umdModule.default.domain).toBe("function");
    expect(typeof umdModule.default.email).toBe("function");
    expect(typeof umdModule.default.ip).toBe("function");
  });

  it("default export works for validation", () => {
    const validate = umdModule.default;
    expect(validate.domain("example.com")).toBe(true);
    expect(validate.email("user@example.com")).toBe(true);
  });

  it("exposes named exports directly", () => {
    expect(typeof umdModule.validateDomain).toBe("function");
    expect(typeof umdModule.validateEmailAddress).toBe("function");
  });

  it("named exports work for validation", () => {
    expect(umdModule.validateDomain("example.com")).toBe(true);
    expect(umdModule.validateEmailAddress("user@example.com")).toBe(true);
  });
});

describe("ESM build (source imports)", () => {
  // Imports the TypeScript source; "ESM build (dist/validate.mjs)" above tests the bundle.

  it("default import has all convenience methods", async () => {
    const mod = await import("../src/validate");
    const validate = mod.default;
    expect(typeof validate.domain).toBe("function");
    expect(typeof validate.email).toBe("function");
    expect(typeof validate.ip).toBe("function");
    expect(typeof validate.ipv4).toBe("function");
    expect(typeof validate.ipv6).toBe("function");
    expect(typeof validate.ldapDN).toBe("function");
    expect(typeof validate.createSchemaValidator).toBe("function");
  });

  it("named exports are available", async () => {
    const mod = await import("../src/validate");
    expect(typeof mod.validateDomain).toBe("function");
    expect(typeof mod.validateEmailAddress).toBe("function");
    expect(typeof mod.validateIPAddress).toBe("function");
    expect(typeof mod.createSchemaValidator).toBe("function");
  });

  it("default and named exports produce same results", async () => {
    const mod = await import("../src/validate");
    const validate = mod.default;
    expect(validate.domain("example.com")).toBe(mod.validateDomain("example.com"));
    expect(validate.email("user@test.com", false)).toBe(mod.validateEmailAddress("user@test.com", false));
  });
});
