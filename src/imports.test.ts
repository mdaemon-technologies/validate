/**
 * Tests that verify the built dist files export correctly
 * for all documented import/require patterns.
 */

describe("CJS build (dist/validate.cjs)", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

describe("UMD build (dist/validate.umd.js)", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const umdModule = require("../dist/validate.umd.js");

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
  // This tests the source TypeScript directly (same as what ESM resolves to)
  // The actual ESM .mjs build has the same export structure

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
