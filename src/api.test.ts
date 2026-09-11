/**
 * Pins the public API surface at runtime: the named exports and the default
 * object's aliases, in the source and in the built CommonJS bundle (the last
 * test requires a fresh `npm run build`).
 */
import * as api from "../src/validate";
import { DEFAULT_ALIASES, NAMED_EXPORTS } from "../test-types/public-api";

function namedExports(module: object): string[] {
  return Object.keys(module).filter(key => key !== "default" && key !== "__esModule").sort();
}

describe("public API surface", () => {
  it("has exactly the expected named exports, all functions", () => {
    expect(namedExports(api)).toEqual(NAMED_EXPORTS);
    for (const name of NAMED_EXPORTS) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("has a default object whose aliases are the named exports", () => {
    const defaultObject = api.default as unknown as Record<string, unknown>;
    expect(Object.keys(defaultObject).sort()).toEqual(Object.keys(DEFAULT_ALIASES).sort());
    for (const [alias, name] of Object.entries(DEFAULT_ALIASES)) {
      expect(defaultObject[alias]).toBe((api as Record<string, unknown>)[name]);
    }
  });

  it("is mirrored by the built CommonJS bundle", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bundle = require("../dist/validate.cjs");
    expect(namedExports(bundle)).toEqual(NAMED_EXPORTS);
    expect(Object.keys(bundle.default).sort()).toEqual(Object.keys(DEFAULT_ALIASES).sort());
  });
});
