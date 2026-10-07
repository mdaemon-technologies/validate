import {
  createSchemaValidator,
  isValidPassword,
  ISchema,
  resetPasswordRequirements,
  setPasswordRequirements,
  updateSchema,
  validateDomain,
  validateEmailAddress,
  validateHeader,
  validateHeaderName,
  validateIPAddress,
  validateIPv4,
  validateIPv6,
  validateLdapDN,
  validatePassword,
  validatePhoneNumber,
  validateWindowsFileName,
  validateWindowsPath
} from "../src/validate";

describe("validateWindowsPath", () => {
  it("rejects adversarial input without catastrophic backtracking", () => {
    const evil = "C:\\" + "a".repeat(26) + "|";
    const start = Date.now();
    expect(validateWindowsPath(evil)).toBe(false);
    expect(validateWindowsPath(evil, true)).toBe(false);
    // The backtracking regex took ~2 s here; the generous limit avoids CI flakes.
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("accepts single-character names and wildcard patterns", () => {
    expect(validateWindowsPath("C:\\a")).toBe(true);
    expect(validateWindowsPath("C:\\*", true)).toBe(true);
    expect(validateWindowsPath("\\\\server\\share")).toBe(true);
  });

  it("still rejects empty segments, trailing separators and bare roots", () => {
    expect(validateWindowsPath("C:\\")).toBe(false);
    expect(validateWindowsPath("C:\\a\\")).toBe(false);
    expect(validateWindowsPath("C:\\a\\\\b")).toBe(false);
  });

  it("rejects control characters", () => {
    expect(validateWindowsPath("C:\\a\tb")).toBe(false);
    expect(validateWindowsPath("C:\\a\u0000b")).toBe(false);
  });
});

describe("validateWindowsFileName", () => {
  it("rejects control characters", () => {
    expect(validateWindowsFileName("a\tb")).toBe(false);
    expect(validateWindowsFileName("a\u0000b")).toBe(false);
  });

  it("accepts a tilde, which is legal in Windows file names", () => {
    expect(validateWindowsFileName("~test.txt")).toBe(true);
  });
});

describe("validateIPAddress", () => {
  it("accepts IPv6 addresses that contain no decimal digits", () => {
    expect(validateIPAddress("::")).toBe(true);
    expect(validateIPAddress("abcd::ef")).toBe(true);
  });

  it("limits IPv6 prefix lengths to 0-128", () => {
    expect(validateIPAddress("::1/128")).toBe(true);
    expect(validateIPAddress("::1/129")).toBe(false);
    expect(validateIPAddress("::1/999")).toBe(false);
  });

  it("restricts IPv6 zone IDs to interface-name characters", () => {
    expect(validateIPAddress("fe80::1%eth0")).toBe(true);
    expect(validateIPAddress("fe80::1%a b <x>")).toBe(false);
  });

  it("classifies IPv4-mapped IPv6 addresses as IPv6", () => {
    expect(validateIPv6("::ffff:1.2.3.4")).toBe(true);
    expect(validateIPv4("::ffff:1.2.3.4")).toBe(false);
  });

  it("accepts IPv4 wildcard patterns (? = one char, # = one digit, * = any)", () => {
    expect(validateIPAddress("10.*.*.###", true)).toBe(true);
    expect(validateIPAddress("192.168.?.1", true)).toBe(true);
    expect(validateIPAddress("1#.*.*.*", true)).toBe(true);
  });

  it("rejects IPv4 wildcard patterns that cannot match an address", () => {
    expect(validateIPAddress("a.b.c.*", true)).toBe(false);
    expect(validateIPAddress("evil.example.com.*", true)).toBe(false);
    expect(validateIPAddress("####.1.1.1", true)).toBe(false);
    expect(validateIPAddress("256.*.*.*", true)).toBe(false);
    expect(validateIPAddress("1.2.3.4.*", true)).toBe(false);
  });

  it("accepts IPv6 wildcard patterns", () => {
    expect(validateIPAddress("fe80::*", true)).toBe(true);
    expect(validateIPAddress("2001:db8:*:*", true)).toBe(true);
  });

  it("rejects IPv6 wildcard patterns that cannot match an address", () => {
    expect(validateIPAddress("hello:world:foo:*", true)).toBe(false);
    expect(validateIPAddress(":::*", true)).toBe(false);
    expect(validateIPAddress("12345::*", true)).toBe(false);
  });
});

describe("validateEmailAddress with wildcards", () => {
  it("accepts wildcard patterns", () => {
    expect(validateEmailAddress("*@mdaemon???", true)).toBe(true);
    expect(validateEmailAddress("*@*", true)).toBe(true);
  });

  it("rejects wildcard patterns that are not address-shaped", () => {
    expect(validateEmailAddress("<script>@x*", true)).toBe(false);
    expect(validateEmailAddress("a b@c d *", true)).toBe(false);
    expect(validateEmailAddress("a@b@c*", true)).toBe(false);
    expect(validateEmailAddress("*@", true)).toBe(false);
  });
});

describe("validateEmailAddress control characters", () => {
  it("rejects control characters in the local part", () => {
    expect(validateEmailAddress("us\u0000er@example.com")).toBe(false);
    expect(validateEmailAddress("us\u0007er@example.com")).toBe(false);
    expect(validateEmailAddress("us\u001ber@example.com")).toBe(false);
    expect(validateEmailAddress("us\u007fer@example.com")).toBe(false);
  });

  it("rejects control characters inside a quoted local part", () => {
    expect(validateEmailAddress("\"x\r\nBcc: evil@evil.com\"@example.com")).toBe(false);
    expect(validateEmailAddress("\"a\u0000b\"@example.com")).toBe(false);
  });

  it("rejects leading and trailing control characters instead of trimming them", () => {
    expect(validateEmailAddress("user@example.com\r\n")).toBe(false);
    expect(validateEmailAddress("\r\nuser@example.com")).toBe(false);
    expect(validateEmailAddress("user@example.com\t")).toBe(false);
  });

  it("rejects control characters in wildcard patterns, including at the ends", () => {
    expect(validateEmailAddress("*@example.com\n", true)).toBe(false);
    expect(validateEmailAddress("\t*@example.com", true)).toBe(false);
    expect(validateEmailAddress("*\u0001@example.com", true)).toBe(false);
  });

  it("still trims leading and trailing spaces and accepts quoted spaces", () => {
    expect(validateEmailAddress(" user@example.com ")).toBe(true);
    expect(validateEmailAddress("\"boss ted\"@tommy.com")).toBe(true);
    expect(validateEmailAddress(" *@example.com ", true)).toBe(true);
  });
});

describe("validateHeader control characters", () => {
  it("rejects control characters that trimming the name or value would hide", () => {
    expect(validateHeader("X-Test: value\r\n")).toBe(false);
    expect(validateHeader("\r\nX-Test: value")).toBe(false);
    expect(validateHeader("X-Test\r\n: value")).toBe(false);
    expect(validateHeader("X-Test:\r\n value")).toBe(false);
    expect(validateHeader("X-Test:\tvalue")).toBe(false);
  });

  it("still trims spaces around the name and value", () => {
    expect(validateHeader(" X-Test : value ")).toBe(true);
  });
});

describe("validateIPAddress control characters", () => {
  it("rejects leading and trailing control characters around an IPv6 address", () => {
    expect(validateIPAddress("fe80::1\r\n")).toBe(false);
    expect(validateIPAddress("\r\nfe80::1")).toBe(false);
    expect(validateIPAddress("fe80::1%eth0\n")).toBe(false);
    expect(validateIPAddress("::ffff:1.2.3.4\t")).toBe(false);
    expect(validateIPv6("fe80::1\r\n")).toBe(false);
    expect(validateIPAddress("fe80::1\n/64")).toBe(false);
  });

  it("still rejects control characters in wildcard patterns", () => {
    expect(validateIPAddress("10.*.*.*\n", true)).toBe(false);
    expect(validateIPAddress("fe80::*\r\n", true)).toBe(false);
  });
});

describe("validateLdapDN control characters", () => {
  it("rejects every control character, not only CR and LF", () => {
    expect(validateLdapDN("cn=jo\u0000hn,dc=example,dc=com")).toBe(false);
    expect(validateLdapDN("cn=john,dc=example,dc=com\t")).toBe(false);
    expect(validateLdapDN("cn=john\u001b,dc=example,dc=com")).toBe(false);
    expect(validateLdapDN("cn=john,dc=example,dc=com\u007f")).toBe(false);
    expect(validateLdapDN("cn=john\r\n,dc=example,dc=com")).toBe(false);
  });
});

describe("validateDomain", () => {
  it("rejects empty and malformed labels", () => {
    expect(validateDomain("...")).toBe(false);
    expect(validateDomain("-.-")).toBe(false);
    expect(validateDomain("a..com")).toBe(false);
    expect(validateDomain("a-.com")).toBe(false);
    expect(validateDomain("-a.com")).toBe(false);
    expect(validateDomain("a".repeat(64) + ".com")).toBe(false);
  });

  it("accepts well-formed names, including a trailing root dot", () => {
    expect(validateDomain("my-host.example.com")).toBe(true);
    expect(validateDomain("example.com.")).toBe(true);
  });

  it("accepts wildcard labels", () => {
    expect(validateDomain("mdaemon.*", true)).toBe(true);
    expect(validateDomain("*.example.com", true)).toBe(true);
    expect(validateDomain("ex*le.c?m", true)).toBe(true);
    expect(validateDomain("..*", true)).toBe(false);
  });
});

describe("validateHeaderName", () => {
  it("accepts digits", () => {
    expect(validateHeaderName("Content-MD5")).toBe(true);
    expect(validateHeaderName("X-B3-TraceId")).toBe(true);
    expect(validateHeaderName("-X")).toBe(false);
  });
});

describe("validatePhoneNumber", () => {
  it("requires digits", () => {
    expect(validatePhoneNumber("     ")).toBe(false);
    expect(validatePhoneNumber("-----")).toBe(false);
    expect(validatePhoneNumber("((((()")).toBe(false);
    expect(validatePhoneNumber("1 (832) 526-7777")).toBe(true);
  });
});

describe("password validation", () => {
  afterEach(() => {
    resetPasswordRequirements();
  });

  it("always reports length once requirements are set", () => {
    setPasswordRequirements({ min: 4 });
    expect(validatePassword("Test1").length).toBe(5);
  });

  it("treats a min or max of 0 as 'not set' when no requirements are configured", () => {
    expect(isValidPassword("Test1", false, 0, 0)).toBe(true);
    const result = validatePassword("Test1", false, 0, 0);
    expect(result.min).toBeUndefined();
    expect(result.max).toBeUndefined();
  });

  it("clears the bad password list when given an empty array", () => {
    setPasswordRequirements({ badPasswords: ["secret"] });
    expect(validatePassword("secret").badPassword).toBe(true);
    setPasswordRequirements({ badPasswords: [] });
    expect(validatePassword("secret").badPassword).toBeUndefined();
  });

  it("returns false instead of throwing for a missing requirements object", () => {
    expect(setPasswordRequirements(undefined as any)).toBe(false);
    expect(setPasswordRequirements(null as any)).toBe(false);
  });

  it("does not log when rejecting min >= max", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(setPasswordRequirements({ min: 30, max: 20 })).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("enforces only the configured requirements once any are set", () => {
    expect(isValidPassword("aaaaaaaa")).toBe(false);
    setPasswordRequirements({ min: 8 });
    expect(isValidPassword("aaaaaaaa")).toBe(true);
  });

  it("isValidPassword rejects control characters with the default requirements", () => {
    expect(isValidPassword("Abc\r\ndef1")).toBe(false);
    expect(isValidPassword("Abcdef1\n")).toBe(false);
    expect(isValidPassword("Abc\u0000def1")).toBe(false);
    expect(isValidPassword("Abc\tdef1")).toBe(false);
    expect(isValidPassword("Abcdef1\u007f")).toBe(false);
    expect(isValidPassword("Abc def1")).toBe(true);
  });

  it("isValidPassword rejects control characters once requirements are set", () => {
    setPasswordRequirements({ min: 4 });
    expect(isValidPassword("abc\r\ndef")).toBe(false);
    expect(isValidPassword("abcdef")).toBe(true);
  });

  it("validatePassword reports control characters with the default requirements", () => {
    expect(validatePassword("Abc\r\ndef1").controlCharacters).toBe(true);
    expect(validatePassword("Abc\u0000def1").controlCharacters).toBe(true);
    expect(validatePassword("Abc def1").controlCharacters).toBe(false);
  });

  it("validatePassword reports exactly C0 and DEL as control characters", () => {
    expect(validatePassword("Abcdef1\u001f").controlCharacters).toBe(true);
    expect(validatePassword("Abcdef1\u007f").controlCharacters).toBe(true);
    expect(validatePassword("Abcdef1 ").controlCharacters).toBe(false);
    expect(validatePassword("Abcdef1\u0080").controlCharacters).toBe(false);
  });

  it("validatePassword always reports control characters once requirements are set", () => {
    setPasswordRequirements({ min: 4 });
    expect(validatePassword("abc\tdef")).toEqual({ length: 7, controlCharacters: true, min: true });
    expect(validatePassword("abcdef").controlCharacters).toBe(false);
  });

  it("validatePassword reports no control characters for a non-string", () => {
    expect(validatePassword(undefined as any).controlCharacters).toBe(false);
  });
});

describe("schema validation", () => {
  it("does not apply options or validate to an omitted optional property", () => {
    const validator = createSchemaValidator("regression-optional", {
      type: "object",
      properties: {
        color: { type: "string", options: ["red", "blue"] },
        even: { type: "number", validate: value => value % 2 === 0 }
      }
    });
    expect(validator({})).toEqual({ valid: true, errors: [] });
    expect(validator({ color: "green", even: 3 }).valid).toBe(false);
  });

  it("validates schemas nested deeper than ten levels", () => {
    let schema: ISchema = { type: "string", required: true };
    for (let i = 0; i < 12; i++) {
      schema = { type: "object", required: true, properties: { n: schema } };
    }
    const value: Record<string, unknown> = {};
    let current = value;
    for (let i = 0; i < 11; i++) {
      current.n = {};
      current = current.n as Record<string, unknown>;
    }
    expect(createSchemaValidator("regression-deep", schema)(value).valid).toBe(false);
  });

  it("reports a throwing custom validator as a validation error", () => {
    const validator = createSchemaValidator("regression-throws", {
      type: "string",
      validate: () => { throw new Error("boom"); }
    });
    expect(() => validator("x")).not.toThrow();
    expect(validator("x")).toEqual({ valid: false, errors: ["Custom validation threw: boom"] });
  });

  it("reports only 'Value is required' for a required null", () => {
    const validator = createSchemaValidator("regression-null", { type: "string", required: true });
    expect(validator(null).errors).toEqual(["Value is required"]);
  });

  it("rejects malformed schemas at registration with a TypeError", () => {
    expect(() => createSchemaValidator("regression-pattern", { type: "string", pattern: "(" })).toThrow(TypeError);
    expect(() => updateSchema("regression-pattern", { type: "string", pattern: "(" })).toThrow(TypeError);
    expect(() => createSchemaValidator("regression-prop", { type: "object", properties: { a: null as any } })).toThrow(TypeError);
    expect(() => createSchemaValidator("regression-type", { type: "integer" as any })).toThrow(TypeError);
  });

  it("rejects circular schemas with a TypeError", () => {
    const circular: ISchema = { type: "object", properties: {} };
    circular.properties!.self = circular;
    expect(() => createSchemaValidator("regression-circular", circular)).toThrow(TypeError);
  });

  it("allows one sub-schema to be shared by several properties", () => {
    const name: ISchema = { type: "string", required: true };
    const validator = createSchemaValidator("regression-shared", {
      type: "object",
      properties: { first: name, last: name }
    });
    expect(validator({ first: "a", last: "b" }).valid).toBe(true);
    expect(validator({ first: "a" }).valid).toBe(false);
  });

  it("treats null properties or arraySchema as absent, as serializers emit them", () => {
    expect(createSchemaValidator("regression-null-array", { type: "array", arraySchema: null as any })([1]).valid).toBe(true);
    expect(createSchemaValidator("regression-null-props", { type: "object", properties: null as any })({}).valid).toBe(true);
  });

  it("copies __proto__ keys as plain data instead of prototypes", () => {
    const hidden = createSchemaValidator("regression-proto", JSON.parse('{"type":"object","__proto__":{"properties":{"a":null}}}'));
    expect(() => hidden({ a: 1 })).not.toThrow();

    const named = createSchemaValidator("regression-proto-prop", JSON.parse('{"type":"object","properties":{"__proto__":{"type":"string","required":true}}}'));
    expect(named({}).valid).toBe(false);
    expect(named(JSON.parse('{"__proto__":"x"}')).valid).toBe(true);
  });

  it("only reads the value's own properties", () => {
    const validator = createSchemaValidator("regression-own", { type: "object", properties: { toString: { required: true } } });
    expect(validator({}).valid).toBe(false);
  });

  it("formats any thrown value without throwing itself", () => {
    const validator = createSchemaValidator("regression-throws-odd", {
      validate: () => { throw Object.create(null); }
    });
    expect(() => validator("x")).not.toThrow();
    expect(validator("x").errors[0]).toMatch(/^Custom validation threw/);
  });

  it("rejects cycles anywhere in the schema with a TypeError", () => {
    const options: unknown[] = ["a"];
    options.push(options);
    expect(() => createSchemaValidator("regression-options-cycle", { options })).toThrow(TypeError);
  });

  it("registers heavily shared sub-schemas in linear time", () => {
    let schema: ISchema = { type: "string" };
    for (let i = 0; i < 22; i++) {
      schema = { type: "object", properties: { a: schema, b: schema } };
    }
    const start = Date.now();
    createSchemaValidator("regression-shared-deep", schema);
    expect(Date.now() - start).toBeLessThan(500);
  });
});

describe("review follow-ups", () => {
  afterEach(() => {
    resetPasswordRequirements();
  });

  it("validateLdapDN rejects adversarial input without catastrophic backtracking", () => {
    const start = Date.now();
    expect(validateLdapDN("DC=a".repeat(16) + ",x")).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("keeps an IPv6 prefix after a zone ID containing a dot", () => {
    expect(validateIPAddress("fe80::1%eth0.100/64")).toBe(true);
  });

  it("accepts IPv6 prefix lengths with leading zeros", () => {
    expect(validateIPAddress("::1/01")).toBe(true);
    expect(validateIPAddress("::1/000")).toBe(true);
  });

  it("accepts wildcard patterns with a CIDR suffix or IPv4-mapped tail", () => {
    expect(validateIPAddress("10.*.*.*/8", true)).toBe(true);
    expect(validateIPAddress("2001:db8:*::/64", true)).toBe(true);
    expect(validateIPAddress("::ffff:10.*.*.*", true)).toBe(true);
    expect(validateIPAddress("10.*.*.*/33", true)).toBe(false);
  });

  it("rejects IPv6 wildcard patterns with a lone leading or trailing colon", () => {
    expect(validateIPAddress(":a:*", true)).toBe(false);
    expect(validateIPAddress("*:a:", true)).toBe(false);
  });

  it("only treats * and ? as email wildcards, and trims like the strict check", () => {
    expect(validateEmailAddress("user#1@localhost", true)).toBe(false);
    expect(validateEmailAddress(" *@example.com ", true)).toBe(true);
  });

  it("requires a plausible domain part in email wildcard patterns", () => {
    expect(validateEmailAddress("*@.", true)).toBe(false);
    expect(validateEmailAddress("*@-", true)).toBe(false);
    expect(validateEmailAddress("*@mdaemon???", true)).toBe(true);
  });

  it("does not count * toward the 253-character domain limit either", () => {
    expect(validateDomain("*".repeat(300) + ".com", true)).toBe(true);
  });

  it("rejects Windows path segments made only of spaces", () => {
    expect(validateWindowsPath("C:\\ ")).toBe(false);
    expect(validateWindowsPath("C:\\a\\ \\b")).toBe(false);
    expect(validateWindowsPath("C:\\a b\\c")).toBe(true);
  });

  it("rejects an array passed as password requirements", () => {
    expect(setPasswordRequirements([] as any)).toBe(false);
  });
});
