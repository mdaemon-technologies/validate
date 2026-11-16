import { afterEach, describe, expect, it } from "vitest";
import {
  createSchemaValidator,
  getSchema,
  ISchema,
  isValidPassword,
  resetPasswordRequirements,
  setPasswordRequirements,
  updateSchema,
  validatePassword
} from "../src/validate";

// Schemas are module-level state shared by every test file, so each name is unique.
let counter = 0;
const uniqueName = (label: string): string => `schema-test-${label}-${++counter}`;
const validatorFor = (label: string, schema: unknown) => createSchemaValidator(uniqueName(label), schema as ISchema);

// Builds a schema `levels` schemas deep, each the arraySchema of the one above it.
function arraySchemaChain(levels: number, leaf: ISchema = { type: "number" }): ISchema {
  let schema = leaf;
  for (let i = 1; i < levels; i++) {
    schema = { type: "array", arraySchema: schema };
  }
  return schema;
}

describe("schema validators never throw on hostile values", () => {
  it("reports a revoked Proxy as unreadable", () => {
    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    for (const schema of [{}, { type: "object" }, { type: "array", arraySchema: { type: "string" } }]) {
      expect(validatorFor("revoked", schema)(revocable.proxy)).toEqual({ valid: false, errors: ["Value could not be read"] });
    }
  });

  it("reports a property whose getter throws as unreadable", () => {
    const validator = validatorFor("getter", { type: "object", properties: { a: { type: "string" }, b: { type: "string" } } });
    const value = { get a(): string { throw new Error("x"); }, b: 1 };
    expect(validator(value)).toEqual({ valid: false, errors: ["a: Value could not be read", "b: Expected string, got number"] });
  });

  it("reports a property whose Proxy traps throw as unreadable", () => {
    const validator = validatorFor("descriptor-trap", { type: "object", properties: { a: { type: "string" } } });
    const descriptorTrap = new Proxy({ a: "x" }, { getOwnPropertyDescriptor() { throw new Error("x"); } });
    const getTrap = new Proxy({ a: "x" }, { get() { throw new Error("x"); } });
    expect(validator(descriptorTrap)).toEqual({ valid: false, errors: ["a: Value could not be read"] });
    expect(validator(getTrap)).toEqual({ valid: false, errors: ["a: Value could not be read"] });
  });

  it("does not call an array's own forEach", () => {
    const validator = validatorFor("own-foreach", { type: "array", arraySchema: { type: "number" } });
    const value: any = [1, "x"];
    value.forEach = 5;
    expect(validator(value)).toEqual({ valid: false, errors: ["[1]: Expected number, got string"] });
  });

  it("reports an array item whose getter throws as unreadable", () => {
    const validator = validatorFor("item-getter", { type: "array", arraySchema: { type: "number" } });
    const value: number[] = [1, 2, 3];
    Object.defineProperty(value, 1, { get() { throw new Error("x"); } });
    expect(validator(value)).toEqual({ valid: false, errors: ["[1]: Value could not be read"] });
  });

  it("reports an array Proxy whose get trap throws as unreadable", () => {
    const validator = validatorFor("array-proxy", { type: "array", arraySchema: { type: "number" }, minItems: 1 });
    const throwsAlways = new Proxy([1, 2], { get() { throw new Error("x"); } });
    const throwsOnItem = new Proxy([1, 2], {
      get(target, key, receiver) {
        if (key === "0") {
          throw new Error("x");
        }
        return Reflect.get(target, key, receiver);
      }
    });
    expect(validator(throwsAlways)).toEqual({ valid: false, errors: ["Value could not be read"] });
    expect(validator(throwsOnItem)).toEqual({ valid: false, errors: ["[0]: Value could not be read"] });
  });

  it("reports an array Proxy with an impossible length as unreadable", () => {
    const validator = validatorFor("array-length", { type: "array", arraySchema: { type: "number" } });
    for (const length of [-1, 1.5, "2", Infinity, 2 ** 32]) {
      const value = new Proxy([1], { get: (target, key, receiver) => key === "length" ? length : Reflect.get(target, key, receiver) });
      expect(validator(value)).toEqual({ valid: false, errors: ["Value could not be read"] });
    }
  });
});

describe("schema error messages never throw", () => {
  it("formats a custom validator's error whose message is a Symbol", () => {
    const error = new Error();
    (error as any).message = Symbol("odd");
    const validator = validatorFor("symbol-message", { validate: () => { throw error; } });
    expect(validator("x")).toEqual({ valid: false, errors: ["Custom validation threw: Symbol(odd)"] });
  });

  it("formats a thrown value that cannot be converted to a string", () => {
    const unprintable = { toString(): string { throw new Error("no"); } };
    const badMessage = new Error();
    Object.defineProperty(badMessage, "message", { get() { throw new Error("no"); } });
    for (const thrown of [unprintable, badMessage, Symbol("s")]) {
      const validator = validatorFor("unprintable", { validate: () => { throw thrown; } });
      const expected = typeof thrown === "symbol" ? "Symbol(s)" : "a value that cannot be displayed";
      expect(validator("x")).toEqual({ valid: false, errors: [`Custom validation threw: ${expected}`] });
    }
  });

  it("formats options that cannot be joined", () => {
    const unprintable = { toString(): string { throw new Error("no"); } };
    const validator = validatorFor("odd-options", { options: [Symbol("s"), unprintable, "a"] });
    expect(validator("b")).toEqual({
      valid: false,
      errors: ["Invalid value, expected one of: Symbol(s), a value that cannot be displayed, a"]
    });
  });
});

describe("schema number ranges", () => {
  it("fails NaN against minimum and maximum", () => {
    expect(validatorFor("nan-range", { type: "number", minimum: 0, maximum: 120 })(NaN))
      .toEqual({ valid: false, errors: ["Minimum value is 0", "Maximum value is 120"] });
    expect(validatorFor("nan-min", { type: "number", minimum: 0 })(NaN))
      .toEqual({ valid: false, errors: ["Minimum value is 0"] });
    expect(validatorFor("nan-max", { type: "number", maximum: 0 })(NaN))
      .toEqual({ valid: false, errors: ["Maximum value is 0"] });
  });

  it("still accepts NaN as a number when no range is set", () => {
    expect(validatorFor("nan-type", { type: "number" })(NaN)).toEqual({ valid: true, errors: [] });
  });
});

describe("schema constraints are checked at registration", () => {
  it("accepts a RegExp object as a pattern", () => {
    const validator = validatorFor("regexp", { type: "string", pattern: /^a$/ as any });
    expect(validator("a")).toEqual({ valid: true, errors: [] });
    expect(validator("b")).toEqual({ valid: false, errors: ["Value does not match pattern /^a$/"] });
  });

  it("drops the g and y flags from a RegExp pattern, which would make it stateful", () => {
    const name = uniqueName("regexp-flags");
    const validator = createSchemaValidator(name, { type: "string", pattern: /^a$/giy as any });
    expect(validator("A").valid).toBe(true);
    expect(validator("A").valid).toBe(true);
    expect(validator("b").errors).toEqual(["Value does not match pattern /^a$/i"]);
    expect(getSchema(name)!.pattern).toEqual(/^a$/i);
  });

  it("keeps a registered RegExp pattern private", () => {
    const pattern = /^a$/;
    const name = uniqueName("regexp-copy");
    const validator = createSchemaValidator(name, { type: "string", pattern: pattern as any });
    (pattern as any).compile("^b$");
    expect(validator("a").valid).toBe(true);

    const copy = getSchema(name)!.pattern as unknown as RegExp;
    expect(copy).toEqual(/^a$/);
    (copy as any).compile("^b$");
    expect(validator("a").valid).toBe(true);
  });

  it("copies a RegExp pattern by its real source and flags", () => {
    const pattern = /^a$/i;
    Object.defineProperty(pattern, "flags", { value: "zz" });
    Object.defineProperty(pattern, "source", { value: "(" });
    const validator = validatorFor("regexp-own-props", { type: "string", pattern: pattern as any });
    expect(validator("A")).toEqual({ valid: true, errors: [] });
  });

  it.each([
    ["pattern", 5, "schema.pattern must be a string or a RegExp"],
    ["pattern", {}, "schema.pattern must be a string or a RegExp"],
    ["minLength", "5", "schema.minLength must be a number"],
    ["maxLength", NaN, "schema.maxLength must be a number"],
    ["maximum", "1", "schema.maximum must be a number"],
    ["minItems", "1", "schema.minItems must be a number"],
    ["maxItems", true, "schema.maxItems must be a number"],
    ["type", "", "schema.type must be one of: string, number, boolean, array, object"],
    ["type", 5, "schema.type must be one of: string, number, boolean, array, object"],
    ["options", "a", "schema.options must be an array"],
    ["validate", "x", "schema.validate must be a function"]
  ])("throws a TypeError for a %s of %s", (key, value, message) => {
    expect(() => validatorFor("bad-constraint", { [key]: value })).toThrow(new TypeError(message));
  });

  it("accepts an infinite limit as no limit", () => {
    const validator = validatorFor("infinite", { type: "number", minimum: -Infinity, maximum: Infinity });
    expect(validator(-1e300)).toEqual({ valid: true, errors: [] });
    expect(validatorFor("infinite-length", { type: "string", maxLength: Infinity })("abc").valid).toBe(true);
  });

  it("keeps treating any truthy required as required", () => {
    expect(validatorFor("required-one", { required: 1 })(undefined)).toEqual({ valid: false, errors: ["Value is required"] });
    expect(validatorFor("required-zero", { required: 0 })(undefined)).toEqual({ valid: true, errors: [] });
  });

  it("names the nested sub-schema with the wrong constraint", () => {
    expect(() => validatorFor("bad-nested", { type: "object", properties: { a: { type: "array", arraySchema: { pattern: 5 } } } }))
      .toThrow(new TypeError("schema.properties.a.arraySchema.pattern must be a string or a RegExp"));
  });

  it("leaves a registered schema in place when updateSchema rejects its replacement", () => {
    const name = uniqueName("keep");
    const validator = createSchemaValidator(name, { type: "string", minLength: 2 });
    expect(() => updateSchema(name, { type: "string", minLength: "5" as any })).toThrow(TypeError);
    expect(validator("ab")).toEqual({ valid: true, errors: [] });
  });

  it("treats a null constraint as absent, as serializers emit them", () => {
    const name = uniqueName("null-constraints");
    const validator = createSchemaValidator(name, {
      type: null, required: null, minLength: null, maxLength: null, minimum: null, maximum: null,
      minItems: null, maxItems: null, options: null, validate: null, pattern: null
    } as any);
    expect(validator(5)).toEqual({ valid: true, errors: [] });
    expect(getSchema(name)).toEqual({});
  });
});

describe("custom validate functions", () => {
  it("are called without the schema as this", () => {
    const name = uniqueName("this");
    const seen: unknown[] = [];
    createSchemaValidator(name, {
      type: "string",
      minLength: 2,
      validate: function (this: unknown) { seen.push(this); return true; }
    })("abc");
    expect(seen).toEqual([undefined]);
    expect(getSchema(name)!.minLength).toBe(2);
  });

  it("cannot change the registered schema", () => {
    const name = uniqueName("this-mutate");
    const validator = createSchemaValidator(name, {
      type: "object",
      properties: { a: { type: "string" } },
      validate: function (this: any) {
        try {
          this.properties.self = this;
          this.minLength = 50;
        }
        catch {
          // this is undefined
        }
        return true;
      }
    });
    expect(validator({ a: "x" })).toEqual({ valid: true, errors: [] });
    expect(validator({ a: "x" })).toEqual({ valid: true, errors: [] });
    expect(getSchema(name)).toEqual({ type: "object", properties: { a: { type: "string" } }, validate: expect.any(Function) });
  });
});

describe("sparse arrays", () => {
  const requiredNumbers = { type: "array", arraySchema: { type: "number", required: true } };

  it("reports each run of holes as one absent item", () => {
    const validator = validatorFor("holes", requiredNumbers);
    const fail = (...errors: string[]) => ({ valid: false, errors });
    // eslint-disable-next-line no-sparse-arrays
    expect(validator([1, , , 2])).toEqual(fail("[1]-[2]: Value is required"));
    // eslint-disable-next-line no-sparse-arrays
    expect(validator([, , 1])).toEqual(fail("[0]-[1]: Value is required"));
    // eslint-disable-next-line no-sparse-arrays
    expect(validator([1, , ,])).toEqual(fail("[1]-[2]: Value is required"));
    // eslint-disable-next-line no-sparse-arrays
    expect(validator([1, , 2])).toEqual(fail("[1]: Value is required"));
    expect(validator(new Array(3))).toEqual(fail("[0]-[2]: Value is required"));
    // eslint-disable-next-line no-sparse-arrays
    expect(validator([, "x", , , 3, ,])).toEqual(fail(
      "[0]: Value is required",
      "[1]: Expected number, got string",
      "[2]-[3]: Value is required",
      "[5]: Value is required"
    ));
  });

  it("still reports each explicit undefined item", () => {
    expect(validatorFor("explicit-undefined", requiredNumbers)([undefined, undefined])).toEqual({
      valid: false,
      errors: ["[0]: Value is required", "[1]: Value is required"]
    });
  });

  it("reports nothing for holes when items are optional", () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(validatorFor("optional-holes", { type: "array", arraySchema: { type: "number" } })([1, , , 2, ,])).toEqual({ valid: true, errors: [] });
  });

  it("leaves dense arrays unchanged, and ignores non-index properties", () => {
    const value: any = [1, "a", 2, "b"];
    value.extra = "x";
    expect(validatorFor("dense", requiredNumbers)(value)).toEqual({
      valid: false,
      errors: ["[1]: Expected number, got string", "[3]: Expected number, got string"]
    });
  });

  it("validates a sparse array of the maximum length quickly", () => {
    const value: unknown[] = [];
    value.length = 2 ** 32 - 1;
    value[5] = "x";
    value[10] = 1;
    const start = Date.now();
    const result = validatorFor("huge-sparse", requiredNumbers)(value);
    expect(Date.now() - start).toBeLessThan(500);
    expect(result).toEqual({
      valid: false,
      errors: [
        "[0]-[4]: Value is required",
        "[5]: Expected number, got string",
        "[6]-[9]: Value is required",
        "[11]-[4294967294]: Value is required"
      ]
    });
  });

  it("validates a Proxy's indices in ascending order", () => {
    const value = new Proxy([1, "x", "y"], { ownKeys: () => ["2", "length", "1", "0"] });
    expect(validatorFor("proxy-order", requiredNumbers)(value)).toEqual({
      valid: false,
      errors: ["[1]: Expected number, got string", "[2]: Expected number, got string"]
    });
  });

  it("reports an array whose own keys cannot be listed as unreadable", () => {
    const value = new Proxy([1], { ownKeys() { throw new Error("x"); } });
    expect(validatorFor("proxy-keys", requiredNumbers)(value)).toEqual({ valid: false, errors: ["Value could not be read"] });
  });

  it("does not read a hole from Array.prototype", () => {
    const validator = validatorFor("holes-proto", { type: "array", arraySchema: { type: "number" } });
    let result;
    (Array.prototype as any)[0] = "inherited";
    try {
      result = validator(new Array(1));
    }
    finally {
      delete (Array.prototype as any)[0];
    }
    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe("schema nesting depth", () => {
  const tooDeep = new TypeError("A schema cannot nest objects and arrays more than 1000 levels deep");

  it("rejects a deeply nested schema with a TypeError", () => {
    let schema: ISchema = { type: "string" };
    for (let i = 0; i < 20000; i++) {
      schema = { type: "object", properties: { n: schema } };
    }
    expect(() => validatorFor("too-deep", schema)).toThrow(tooDeep);
  });

  it("rejects deeply nested options with a TypeError", () => {
    let value: unknown = "x";
    for (let i = 0; i < 20000; i++) {
      value = [value];
    }
    expect(() => validatorFor("too-deep-options", { options: [value] })).toThrow(tooDeep);
  });

  it("accepts, copies and validates a schema exactly 1000 levels deep", () => {
    const name = uniqueName("deepest");
    const validator = createSchemaValidator(name, arraySchemaChain(1000));
    expect(getSchema(name)).toEqual(arraySchemaChain(1000));

    // 999 nested arrays around "x", which reaches the number schema at the bottom.
    let value: unknown = ["x"];
    for (let i = 1; i < 999; i++) {
      value = [value];
    }
    const result = validator(value);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/: Expected number, got string$/);

    expect(() => validatorFor("deepest-plus-one", arraySchemaChain(1001))).toThrow(tooDeep);
    expect(() => validatorFor("deepest-plus-options", arraySchemaChain(1000, { options: [] }))).toThrow(tooDeep);
  });

  it("counts a shared sub-schema at its deepest use", () => {
    const shared = arraySchemaChain(600);
    const fine = { type: "object", properties: { a: shared, b: { type: "array", arraySchema: shared } } };
    expect(() => validatorFor("shared-fine", fine)).not.toThrow();

    const deeper = { type: "object", properties: { a: shared, b: arraySchemaChain(400, shared) } };
    expect(() => validatorFor("shared-too-deep", deeper)).toThrow(tooDeep);
  });

  it("counts shared options at their deepest use", () => {
    let nested: unknown = "x";
    for (let i = 0; i < 600; i++) {
      nested = [nested];
    }
    expect(() => validatorFor("shared-options-fine", { options: [nested, nested] })).not.toThrow();

    let wrapped: unknown = nested;
    for (let i = 0; i < 400; i++) {
      wrapped = [wrapped];
    }
    expect(() => validatorFor("shared-options-too-deep", { options: [nested, wrapped] })).toThrow(tooDeep);
  });
});

describe("password lengths below 1", () => {
  afterEach(() => {
    resetPasswordRequirements();
  });

  it("ignores a configured max between 0 and 1", () => {
    expect(setPasswordRequirements({ max: 0.5 })).toBe(true);
    expect(isValidPassword("a")).toBe(true);
    expect(validatePassword("a").max).toBeUndefined();
  });

  it("ignores a configured min between 0 and 1", () => {
    expect(setPasswordRequirements({ min: 0.5 })).toBe(true);
    expect(isValidPassword("")).toBe(true);
    expect(validatePassword("").min).toBeUndefined();
  });

  it("ignores a per-call min or max between 0 and 1", () => {
    expect(isValidPassword("Aa1", false, 0, 0.5)).toBe(true);
    expect(validatePassword("Aa1", false, 0.5, 0.5)).not.toHaveProperty("min");
    expect(validatePassword("Aa1", false, 0.5, 0.5)).not.toHaveProperty("max");
  });

  it("still enforces a min or max of 1", () => {
    expect(validatePassword("", false, 1).min).toBe(false);
    expect(validatePassword("ab", false, 0, 1).max).toBe(false);
  });
});

describe("validation near the stack limit", () => {
  it("reports an error instead of throwing when the caller's stack is nearly full", () => {
    const validator = validatorFor("near-stack-limit", arraySchemaChain(1000));
    let value: unknown = 1;
    for (let i = 1; i < 1000; i++) {
      value = [value];
    }

    // Call the validator from deeper and deeper in the stack, until the stack
    // runs out in burn itself. A validator call must never throw.
    const thrown: unknown[] = [];
    const messages = new Set<string>();
    const burn = (frames: number): void => {
      if (frames > 0) {
        burn(frames - 1);
        return;
      }
      try {
        messages.add(validator(value).errors.join("|"));
      } catch (error) {
        thrown.push(error);
      }
    };
    for (let frames = 0; frames < 100000; frames += 250) {
      try {
        burn(frames);
      } catch {
        break; // burn's own recursion overflowed: deep enough
      }
    }
    expect(thrown).toEqual([]);
    // Valid with room to spare. When the stack runs out, the error is reported
    // (where it runs out decides between "could not be validated" and, inside a
    // property read, "could not be read"), never thrown.
    expect(messages.has("")).toBe(true);
    const unexpected = [...messages].filter(m => m !== "" &&
      !m.endsWith("Value could not be validated: the stack ran out") &&
      !m.endsWith("Value could not be read"));
    expect(unexpected).toEqual([]);
  });
});
