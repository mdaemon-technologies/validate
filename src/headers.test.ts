import { describe, expect, it } from "vitest";
import validate, {
  validateHeader,
  validateHeaderName,
  validateHeaderValue
} from "../src/validate";

// RFC 9110 section 5.1: field-name = token = 1*tchar
const TCHAR_SYMBOLS = "!#$%&'*+-.^_`|~";

describe("validateHeaderName (RFC 9110 token)", () => {
  it("accepts every tchar, in any position", () => {
    expect(validateHeaderName(TCHAR_SYMBOLS)).toBe(true);
    for (const c of TCHAR_SYMBOLS) {
      expect(validateHeaderName(c)).toBe(true);
      expect(validateHeaderName(c + "X")).toBe(true);
      expect(validateHeaderName("X" + c)).toBe(true);
    }
    expect(validateHeaderName("-X-Test")).toBe(true);
    expect(validateHeaderName("X-Test-")).toBe(true);
    expect(validateHeaderName("X_Custom.Header~1")).toBe(true);
    expect(validateHeaderName("aZ09")).toBe(true);
  });

  it("rejects separators, whitespace and every other character", () => {
    expect(validateHeaderName("")).toBe(false);
    for (const c of "\"(),/:;<=>?@[\\]{} \t") {
      expect(validateHeaderName("X" + c + "Y")).toBe(false);
    }
    for (let code = 0; code <= 0x1f; code++) {
      expect(validateHeaderName("X" + String.fromCharCode(code))).toBe(false);
    }
    expect(validateHeaderName("X\u007f")).toBe(false);
    expect(validateHeaderName("X\u00e9")).toBe(false);
    expect(validateHeaderName("X\u00a0")).toBe(false);
    expect(validateHeaderName("X\ud800")).toBe(false);
    expect(validateHeaderName(" X")).toBe(false);
    expect(validateHeaderName("X ")).toBe(false);
  });

  it("rejects non-string input without throwing", () => {
    for (const input of [undefined, null, 1, {}, [], ["X"]]) {
      expect(validateHeaderName(input as unknown as string)).toBe(false);
    }
  });
});

// Allowed in a value: HTAB, U+0020-U+007E and obs-text U+0080-U+00FF (node:http's rule).
describe("validateHeaderValue (allow-list)", () => {
  it("accepts HTAB, visible ASCII, SP and obs-text", () => {
    expect(validateHeaderValue("a\tb")).toBe(true);
    expect(validateHeaderValue("\t")).toBe(true);
    let ascii = "";
    for (let code = 0x20; code <= 0x7e; code++) {
      ascii += String.fromCharCode(code);
    }
    expect(validateHeaderValue(ascii)).toBe(true);
    let obsText = "";
    for (let code = 0x80; code <= 0xff; code++) {
      obsText += String.fromCharCode(code);
    }
    expect(validateHeaderValue(obsText)).toBe(true);
  });

  it("accepts an empty value (field-value = *field-content)", () => {
    expect(validateHeaderValue("")).toBe(true);
  });

  it("still accepts leading and trailing SP when validating a value on its own", () => {
    expect(validateHeaderValue(" a")).toBe(true);
    expect(validateHeaderValue("a ")).toBe(true);
    expect(validateHeaderValue(" ")).toBe(true);
  });

  it("rejects every C0 control character other than HTAB, and DEL", () => {
    for (let code = 0; code <= 0x1f; code++) {
      if (code === 0x09) {
        continue;
      }
      expect(validateHeaderValue("a" + String.fromCharCode(code) + "b")).toBe(false);
    }
    expect(validateHeaderValue("a\u007fb")).toBe(false);
    expect(validateHeaderValue("a\r\n b")).toBe(false); // obs-fold
  });

  it("rejects characters above U+00FF, which latin1 would truncate to CR or LF", () => {
    // Written as latin1, U+010D U+010A become CR LF: header injection.
    expect(validateHeaderValue("\u010d\u010aSet-Cookie: x=1")).toBe(false);
    expect(validateHeaderValue("a\u0100")).toBe(false);
    expect(validateHeaderValue("a\u2028")).toBe(false);
    expect(validateHeaderValue("a\ufeff")).toBe(false);
    expect(validateHeaderValue("\u20ac")).toBe(false);
    expect(validateHeaderValue("\ud83d\ude00")).toBe(false);
  });

  it("rejects lone surrogates", () => {
    expect(validateHeaderValue("a\ud800")).toBe(false);
    expect(validateHeaderValue("\udc00a")).toBe(false);
  });

  it("rejects non-string input without throwing", () => {
    for (const input of [undefined, null, 0, 1, {}, [], ["a"]]) {
      expect(validateHeaderValue(input as unknown as string)).toBe(false);
    }
  });
});

describe("validateHeader (RFC 9112 section 5.1 field line)", () => {
  it("accepts HTAB inside the value and as OWS after the colon and at the end", () => {
    expect(validateHeader("X-Test: a\tb")).toBe(true);
    expect(validateHeader("X-Test:\tvalue")).toBe(true);
    expect(validateHeader("X-Test:value")).toBe(true);
    expect(validateHeader("X-Test: value\t")).toBe(true);
    expect(validateHeader("X-Test: \t value \t ")).toBe(true);
  });

  it("accepts an empty value", () => {
    expect(validateHeader("X-Test:")).toBe(true);
    expect(validateHeader("X-Test: ")).toBe(true);
    expect(validateHeader("X-Test:\t")).toBe(true);
  });

  it("accepts any token as the name and keeps later colons in the value", () => {
    expect(validateHeader("-X-Test: v")).toBe(true);
    expect(validateHeader("X_Custom.Header~1: v")).toBe(true);
    expect(validateHeader("Host: example.com:8080")).toBe(true);
    expect(validateHeader("X-Test: caf\u00e9")).toBe(true);
  });

  it("rejects whitespace before the colon or before the name", () => {
    expect(validateHeader("X-Test : v")).toBe(false);
    expect(validateHeader("X-Test\t: v")).toBe(false);
    expect(validateHeader(" X-Test: v")).toBe(false);
    expect(validateHeader("\tX-Test: v")).toBe(false);
    expect(validateHeader("\u00a0X-Test: v")).toBe(false);
    expect(validateHeader("\ufeffX-Test: v")).toBe(false);
    expect(validateHeader(" X-Test : value ")).toBe(false);
  });

  it("rejects a missing or empty name", () => {
    expect(validateHeader("X-Test")).toBe(false);
    expect(validateHeader(": v")).toBe(false);
    expect(validateHeader(":")).toBe(false);
    expect(validateHeader("")).toBe(false);
  });

  it("strips only SP and HTAB around the value, not Unicode whitespace", () => {
    expect(validateHeader("X-Test: v\u2028")).toBe(false);
    expect(validateHeader("X-Test:\u2028v")).toBe(false);
    expect(validateHeader("X-Test: v\u00a0")).toBe(true); // U+00A0 is obs-text
    expect(validateHeader("X-Test: v\u3000")).toBe(false);
  });

  it("still rejects CR, LF, NUL and other control characters anywhere", () => {
    expect(validateHeader("X-Test: value\r\n")).toBe(false);
    expect(validateHeader("\r\nX-Test: value")).toBe(false);
    expect(validateHeader("X-Test\r\n: value")).toBe(false);
    expect(validateHeader("X-Test:\r\n value")).toBe(false); // obs-fold
    expect(validateHeader("X-Test: a\r\n b")).toBe(false); // obs-fold
    expect(validateHeader("X-Test: a\u0000b")).toBe(false);
    expect(validateHeader("X-Test: a\u000bb")).toBe(false);
    expect(validateHeader("X-Test: a\u007fb")).toBe(false);
    expect(validateHeader("X\u0000Test: v")).toBe(false);
  });

  it("rejects characters above U+00FF in the value", () => {
    expect(validateHeader("X-Test: \u010d\u010aSet-Cookie: x=1")).toBe(false);
    expect(validateHeader("X-Test: a\ud800")).toBe(false);
    expect(validateHeader("X-Test: \ud83d\ude00")).toBe(false);
  });

  it("rejects non-string input without throwing", () => {
    for (const input of [undefined, null, 0, 1, {}, [], ["X-Test: v"]]) {
      expect(validateHeader(input as unknown as string)).toBe(false);
    }
  });

  it("is exposed as validate.header, validate.headerName and validate.headerValue", () => {
    expect(validate.header).toBe(validateHeader);
    expect(validate.headerName).toBe(validateHeaderName);
    expect(validate.headerValue).toBe(validateHeaderValue);
  });
});
