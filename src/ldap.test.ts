import { describe, expect, it } from "vitest";
import { validateLdapDN } from "../src/validate";

// String.raw keeps the DN backslashes literal, as they are written in RFC 4514.
const raw = String.raw;

describe("validateLdapDN: RFC 4514 section 4 examples", () => {
  it.each([
    "UID=jsmith,DC=example,DC=net",
    "OU=Sales+CN=J.  Smith,DC=example,DC=net",
    raw`CN=James \"Jim\" Smith\, III,DC=example,DC=net`,
    raw`CN=Before\0dAfter,DC=example,DC=net`,
    "1.3.6.1.4.1.1466.0=#04024869",
    "1.3.6.1.4.1.1466.0=#04024869,DC=example,DC=com",
    raw`CN=Lu\C4\8Di\C4\87`,
    "CN=Steve Kille,O=Isode Limited,C=GB"
  ])("accepts %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(true);
  });
});

describe("validateLdapDN: attribute types", () => {
  it.each([
    "o=Example",
    "c=US",
    "mail=john@example.com,dc=example,dc=com",
    "commonName=John Smith",
    "x-custom-attr2=1",
    "dc=com,cn=john",
    "dc=example,ou=Sales,cn=john,o=Org",
    "2.0.1=x",
    "0.9.2342.19200300.100.1.1=johnboy",
    "CN=a,cN=b,Cn=c"
  ])("accepts %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(true);
  });

  it.each([
    "OID.2.5.4.3=x",
    "oid.2.5.4.3=x",
    "02.5.4.3=x",
    "2.5.04.3=x",
    "2=x",
    "2.=x",
    ".2.5=x",
    "2..5=x",
    "1cn=x",
    "-cn=x",
    "c_n=x",
    "cn.x=y",
    "c\u00e9=x",
    "=x",
    "cn",
    "cn x",
    "cn==x,=y"
  ])("rejects %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(false);
  });
});

describe("validateLdapDN: separators and spacing", () => {
  it.each([
    "CN=John Smith, OU=Sales, OU=East, DC=corp, DC=com",
    "uid  = john , ou = Group , dc = mdaemon , dc = com",
    "cn= john ,dc=com",
    " cn=john",
    "cn=john ",
    "cn=a+sn=b",
    "cn=a + sn=b",
    "cn=john.doe+email=john@jedi.mail"
  ])("accepts %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(true);
  });

  it.each([
    "",
    " ",
    "   ",
    "test",
    ",ou=a",
    "OU=a,",
    "OU=a, ",
    "OU=a,,DC=b",
    "OU=a, ,DC=b",
    "+cn=a",
    "cn=a+",
    "cn=+",
    "cn=a+b",
    "cn=a++sn=b",
    "cn=a;dc=b",
    "cn=a ; dc=b"
  ])("rejects %j", (dn) => {
    expect(validateLdapDN(dn)).toBe(false);
  });
});

describe("validateLdapDN: string values", () => {
  it.each([
    raw`cn=Smith\, John,dc=example,dc=com`,
    raw`cn=\"\+\,\;\<\>\\\ \#\=`,
    raw`cn=\#start`,
    raw`cn=\ lead and trail\ `,
    raw`cn=\00`,
    raw`cn=\5C\5c`,
    "cn=a#b",
    "cn=a=b",
    "cn=a*b(c)!",
    "cn=Lu\u010di\u0107",
    "cn=\ud83d\ude00",
    raw`cn=\F0\9F\98\80`,
    raw`cn=\E2\82\AC`,
    raw`cn=\EF\BF\BD`,
    raw`cn=\F4\8F\BF\BF`,
    "cn=",
    "cn=,dc=com",
    "o=",
    "2.5.4.3=",
    "cn= "
  ])("accepts %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(true);
  });

  it.each([
    "cn=a;b",
    "cn=a<b",
    "cn=a>b",
    'cn=a"b',
    'cn="quoted"',
    "cn=a\\",
    raw`cn=a\zz`,
    raw`cn=a\4`,
    raw`cn=a\4,dc=b`,
    raw`cn=a\g0`
  ])("rejects %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(false);
  });

  it("rejects lone UTF-16 surrogates", () => {
    expect(validateLdapDN("cn=\ud800")).toBe(false);
    expect(validateLdapDN("cn=\udc00")).toBe(false);
    expect(validateLdapDN("cn=\udc00\ud800")).toBe(false);
    expect(validateLdapDN("cn=a\ud800b,dc=com")).toBe(false);
    expect(validateLdapDN("cn=\ud800,dc=com")).toBe(false);
  });

  it.each([
    [raw`cn=\C4`, "truncated sequence"],
    [raw`cn=\C4x`, "literal character inside a sequence"],
    [raw`cn=\C4\2C`, "ASCII byte inside a sequence"],
    [raw`cn=\C4\,`, "escaped special inside a sequence"],
    [raw`cn=\C4,dc=com`, "sequence cut by a separator"],
    [raw`cn=\80`, "lone continuation byte"],
    [raw`cn=\C0\80`, "overlong two-byte form"],
    [raw`cn=\E0\80\80`, "overlong three-byte form"],
    [raw`cn=\F0\80\80\80`, "overlong four-byte form"],
    [raw`cn=\ED\A0\80`, "encoded surrogate"],
    [raw`cn=\F4\90\80\80`, "above U+10FFFF"],
    [raw`cn=\FF`, "invalid lead byte"]
  ])("rejects hex escapes that are not UTF-8: %s (%s)", (dn) => {
    expect(validateLdapDN(dn)).toBe(false);
  });
});

describe("validateLdapDN: hex string values", () => {
  it.each([
    "cn=#04024869",
    "cn=#abCD",
    "cn= #0402 ",
    "cn=#04+sn=#05,dc=#ff"
  ])("accepts %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(true);
  });

  it.each([
    "cn=#",
    "cn=#0",
    "cn=#zz",
    "cn=#041",
    "cn=#04 02",
    "cn=#04x",
    "cn=#,dc=com"
  ])("rejects %s", (dn) => {
    expect(validateLdapDN(dn)).toBe(false);
  });
});

describe("validateLdapDN: wrong types and control characters", () => {
  it.each([undefined, null, 1, {}, ["cn=a"], true])("rejects %j", (value) => {
    expect(validateLdapDN(value as unknown as string)).toBe(false);
  });

  it("rejects raw control characters but accepts their escaped forms", () => {
    expect(validateLdapDN("cn=a\u0000")).toBe(false);
    expect(validateLdapDN("cn=a\u007f")).toBe(false);
    expect(validateLdapDN("cn=a,\tdc=b")).toBe(false);
    expect(validateLdapDN(raw`cn=a\00\1f\7f`)).toBe(true);
  });
});

describe("validateLdapDN: large and adversarial input", () => {
  // Each case is 7-10 MB. The linear scanner takes ~0.2 s on each in plain Node; a
  // quadratic regression would take hours, so the generous limit catches it without
  // flaking on a loaded machine.
  const cases: [string, () => string, boolean][] = [
    ["7 MB of RDNs", () => "dc=c,".repeat(1398110) + "dc=c", true],
    ["7 MB of RDNs with a trailing comma", () => "dc=c,".repeat(1398110), false],
    ["7 MB multi-valued RDN", () => "dc=c+".repeat(1398110) + "dc=c", true],
    ["a 10 MB value", () => "cn=" + "a".repeat(10_000_000), true],
    ["10 MB of backslashes", () => "cn=" + "\\".repeat(10_000_001), false],
    ["10 MB of escaped backslashes", () => "cn=" + "\\5c".repeat(3_000_000), true],
    ["10 MB of spaces", () => "cn=" + " ".repeat(10_000_000), true],
    ["10 MB of equals signs", () => "cn" + "=".repeat(10_000_000), true],
    ["10 MB of commas", () => "cn=a" + ",".repeat(10_000_000), false],
    ["a 10 MB hex string", () => "cn=#" + "0".repeat(10_000_000), true],
    ["an odd 10 MB hex string", () => "cn=#" + "0".repeat(9_999_999), false],
    ["a 10 MB numeric OID", () => "2" + ".5".repeat(5_000_000) + "=x", true],
    ["a 10 MB descr", () => "a".repeat(10_000_000) + "=x", true],
    ["10 MB of UTF-8 escapes", () => "cn=" + "\\C4\\8D".repeat(1_500_000), true],
    ["10 MB of surrogate pairs", () => "cn=" + "\ud83d\ude00".repeat(5_000_000), true]
  ];

  it.each(cases)("handles %s in linear time without throwing", (_name, make, expected) => {
    const dn = make();
    const start = Date.now();
    let result: boolean | undefined;
    expect(() => { result = validateLdapDN(dn); }).not.toThrow();
    expect(result).toBe(expected);
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
