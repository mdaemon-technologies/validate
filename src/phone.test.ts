import { describe, expect, it } from "vitest";
import validate, { validatePhoneNumber } from "../src/validate";

const valid = (str: string) => expect(validatePhoneNumber(str), JSON.stringify(str)).toBe(true);
const invalid = (str: string) => expect(validatePhoneNumber(str), JSON.stringify(str)).toBe(false);

describe("validatePhoneNumber", () => {
  it("accepts the README examples and common formats", () => {
    valid("+1 (832) 526-7777");
    valid("+18325267777");
    valid("(832) 526-7777");
    valid("1 (832) 526-7777");
    valid("+1-832-526-7777");
    valid("+1(832)526-7777");
    valid("(832)-526-7777");
    valid("+49 (0) 30 1234");
    valid("+44 20 7946 0958");
    valid("12345");
    valid("+49 (0) 30 1234 5678 90");
    valid("00000");
    invalid("(((((");
    invalid("555");
    invalid("+0 123 456 7890");
    invalid("12--345");
    invalid("832.526.7777");
  });

  it("counts digits, not characters: 5 to 15 digits (the E.164 maximum)", () => {
    valid("+49 (0) 30 1234 5678 90"); // 15 digits, 23 characters
    valid("123456789012345");
    valid("+123456789012345");
    invalid("011 49 30 1234 5678 90"); // every digit counts, dialing prefixes included
    valid("1 2 3 4 5");
    invalid("1234");
    invalid("+1234");
    invalid("1234567890123456");
    invalid("+1234567890123456");
    invalid("+00000000000000000000");
    invalid("12345678901234567890");
  });

  it("accepts the longest valid layout (32 characters)", () => {
    const longest = "+1 (2) 3 4 5 6 7 8 9 0 1 2 3 4 5";
    expect(longest).toHaveLength(32);
    valid(longest);
    valid("  " + longest + "  ");
  });

  it("trims surrounding ASCII spaces only", () => {
    valid("  12345");
    valid("12345  ");
    valid(" +12345");
    valid("  +1 (832) 526-7777  ");
    valid("12345" + " ".repeat(15));
    invalid("     ");
    invalid("");
    invalid("\t12345");
    invalid("12345\n");
    // The next two contain a literal no-break space (U+00A0), which is not trimmed.
    invalid("\u00a012345");
    invalid("12345\u00a0");
  });

  it("requires '+' to come first and be followed by a non-zero digit", () => {
    invalid("+ 12345");
    invalid("+-12345");
    invalid("+(1) 832 526 7777");
    invalid("+0 123 456 7890");
    invalid("+00000");
    invalid("123+45678");
    invalid("12345+");
    invalid("++12345");
    valid("00000");
    valid("0 123 456 7890");
    valid("(0) 30 1234");
  });

  it("allows one parenthesized group of digits, followed by more digits", () => {
    invalid(")12345(");
    invalid("(12345");
    invalid("12345)");
    invalid("1)(2345");
    invalid("+()()()12345");
    invalid("(-)(-)12345");
    invalid("()12345");
    invalid("(1)(2)345");
    invalid("(1) (2) 345");
    invalid("1 (2) 3 (4) 5");
    invalid("((1)) 2345");
    invalid("(1(2)) 345");
    invalid("( 832) 526-7777");
    invalid("(832 ) 526-7777");
    invalid("(8-32) 526-7777");
    invalid("12345 (6)");
    invalid("(12345)");
    invalid("1 (800)");
    invalid("(+44) 20 7946 0958");
    invalid("+1 (2) 3456789012345678"); // 18 digits
    valid("+44 (0)20 7946 0958");
    valid("+7 (495) 123-45-67");
    valid("1-(800)-555-1234");
  });

  it("rejects leading, trailing and repeated separators", () => {
    invalid("-12345");
    invalid("12345-");
    invalid("12-34--5");
    invalid("12  345");
    invalid("12 -345");
    invalid("+1 (832) 526 - 7777");
    invalid("123" + " ".repeat(15) + "45");
    invalid("(832) -526-7777");
    invalid("(832)- 526-7777");
    invalid("1 -(832) 526-7777");
    invalid("-----");
    invalid("((((()");
  });

  it("rejects characters outside digits, space, hyphen, parentheses and '+'", () => {
    invalid("832.526.7777");
    invalid("832/526/7777");
    invalid("832-526-7777 x123");
    invalid("832-526-7777 ext. 123");
    invalid("1-800-FLOWERS");
    invalid("832_526_7777");
    invalid("[832] 526-7777");
    invalid("\u0661\u0662\u0663\u0664\u0665"); // Arabic-Indic digits
    invalid("\uff11\uff12\uff13\uff14\uff15"); // fullwidth digits
  });

  it("returns false for non-strings without throwing", () => {
    for (const value of [undefined, null, 12345, 18325267777n, {}, [], ["12345"], true, Symbol("x")]) {
      expect(validatePhoneNumber(value as unknown as string)).toBe(false);
    }
    const tricky = { toString: () => { throw new Error("no"); } };
    expect(validatePhoneNumber(tricky as unknown as string)).toBe(false);
  });

  it("is the validate.phoneNumber alias", () => {
    expect(validate.phoneNumber).toBe(validatePhoneNumber);
  });

  it("runs in linear time on 10M-character adversarial input", () => {
    const n = 10_000_000;
    const inputs = [
      "1".repeat(n),
      "1 ".repeat(n / 2),
      "1-".repeat(n / 2) + "1",
      "(" + "1".repeat(n),
      "1".repeat(n) + ")",
      "+" + "1".repeat(n) + "x",
      "(1)" + "1".repeat(n),
      " ".repeat(n),
      " ".repeat(n) + "1",
      " ".repeat(n) + "x" + " ".repeat(n),
      "12345" + " ".repeat(n) + "x",
      "1 ".repeat(n / 2) + "(1"
    ];
    const padded = " ".repeat(n) + "+1 (832) 526-7777" + " ".repeat(n);
    const start = Date.now();
    const results = inputs.map((input) => validatePhoneNumber(input));
    const paddedResult = validatePhoneNumber(padded);
    const elapsed = Date.now() - start;
    expect(results.every((result) => result === false)).toBe(true);
    expect(paddedResult).toBe(true);
    // A linear scan (which also flattens these lazily built strings) takes well under a
    // second; a quadratic one would take minutes, so the generous limit avoids CI flakes.
    expect(elapsed).toBeLessThan(5000);
  });
});
