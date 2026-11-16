import { describe, expect, it } from "vitest";
import {
  validateDomain,
  validateEmailAddress,
  validateIPAddress,
  validateIPv4,
  validateIPv6
} from "../src/validate";

describe("validateEmailAddress IPv6 address literals (RFC 5321 section 4.1.3)", () => {
  it("allows at most 6 groups besides a ::, so :: stands for at least two", () => {
    expect(validateEmailAddress("u@[IPv6:1:2:3:4:5:6::]")).toBe(true);
    expect(validateEmailAddress("u@[IPv6:1::2:3:4:5:6]")).toBe(true);
    expect(validateEmailAddress("u@[IPv6:1:2:3:4:5:6:7::]")).toBe(false);
    expect(validateEmailAddress("u@[IPv6:1::3:4:5:6:7:8]")).toBe(false);
    expect(validateEmailAddress("u@[IPv6:::2:3:4:5:6:7:8]")).toBe(false);
  });

  it("allows at most 4 groups besides a :: before an IPv4 part", () => {
    expect(validateEmailAddress("u@[IPv6:1:2:3:4::1.2.3.4]")).toBe(true);
    expect(validateEmailAddress("u@[IPv6:1:2:3:4:5::1.2.3.4]")).toBe(false);
    expect(validateEmailAddress("u@[IPv6:1:2:3:4:5:6:1.2.3.4]")).toBe(true);
  });

  it("allows leading zeros in an IPv4 part, as in an IPv4 literal", () => {
    expect(validateEmailAddress("u@[IPv6:::ffff:001.2.3.4]")).toBe(true);
    expect(validateEmailAddress("u@[IPv6:::ffff:1.02.003.4]")).toBe(true);
    expect(validateEmailAddress("u@[IPv6:::ffff:256.2.3.4]")).toBe(false);
    expect(validateEmailAddress("u@[IPv6:::ffff:0001.2.3.4]")).toBe(false);
    expect(validateEmailAddress("u@[IPv6:::ffff:1.2.3]")).toBe(false);
  });
});

describe("validateEmailAddress lengths and encoding", () => {
  it("counts the 64-octet local-part limit in UTF-8 octets", () => {
    expect(validateEmailAddress("\u00e9".repeat(32) + "@example.com")).toBe(true); // 64 octets
    expect(validateEmailAddress("\u00e9".repeat(33) + "@example.com")).toBe(false); // 66 octets
    expect(validateEmailAddress("\u7528".repeat(21) + "@example.com")).toBe(true); // 63 octets
    expect(validateEmailAddress("\u7528".repeat(22) + "@example.com")).toBe(false); // 66 octets
    expect(validateEmailAddress("\ud83d\ude00".repeat(16) + "@example.com")).toBe(true); // 64 octets
    expect(validateEmailAddress("\ud83d\ude00".repeat(17) + "@example.com")).toBe(false); // 68 octets
  });

  it("counts the 254-octet address limit in UTF-8 octets", () => {
    const domain = ["a".repeat(63), "a".repeat(63), "a".repeat(63), "b".repeat(20)].join(".");
    const local = "\u00e9".repeat(32); // 32 characters, 64 octets
    expect(local.length + 1 + domain.length).toBeLessThan(254);
    expect(64 + 1 + domain.length).toBeGreaterThan(254);
    expect(validateEmailAddress(local + "@" + domain)).toBe(false);
    expect(validateEmailAddress("e".repeat(32) + "@" + domain)).toBe(true);
  });

  it("checks the 254 limit after trimming surrounding whitespace", () => {
    const domain = ["a".repeat(63), "a".repeat(63), "a".repeat(63), "b".repeat(60)].join(".");
    const address = "t@" + domain; // 254 characters
    expect(address.length).toBe(254);
    expect(validateEmailAddress(address)).toBe(true);
    expect(validateEmailAddress("  " + address + "  ")).toBe(true);
    expect(validateEmailAddress("  t" + address)).toBe(false);
  });

  it("rejects lone or reversed UTF-16 surrogates", () => {
    expect(validateEmailAddress("\ud800@example.com")).toBe(false);
    expect(validateEmailAddress("a\udfff@example.com")).toBe(false);
    expect(validateEmailAddress("\udfff\ud800@example.com")).toBe(false);
    expect(validateEmailAddress("\"\ud800\"@example.com")).toBe(false);
    expect(validateEmailAddress("*\ud800@example.com", true)).toBe(false);
    expect(validateEmailAddress("\ud83d\ude00@example.com")).toBe(true);
  });
});

describe("validateIPAddress", () => {
  it("rejects leading zeros in an IPv4 address with a prefix length, as without one", () => {
    expect(validateIPAddress("010.0.0.1")).toBe(false);
    expect(validateIPAddress("010.0.0.1/8")).toBe(false);
    expect(validateIPv4("010.1.1.1/8")).toBe(false);
    expect(validateIPAddress("001.002.003.004/32")).toBe(false);
    expect(validateIPAddress("10.0.0.1/8")).toBe(true);
    expect(validateIPAddress("0.0.0.0/0")).toBe(true);
    expect(validateIPAddress("255.255.255.255/32")).toBe(true);
  });

  it("allows only ASCII spaces around an IPv6 address", () => {
    expect(validateIPv6(" ::1 ")).toBe(true);
    expect(validateIPv6("::1\u2028")).toBe(false);
    expect(validateIPv6("::1\u2029")).toBe(false);
    expect(validateIPv6("\ufeff::1")).toBe(false);
    expect(validateIPv6("\u3000::1\u3000")).toBe(false);
    expect(validateIPv6("::1\u00a0")).toBe(false);
    expect(validateIPAddress("::1%eth0\u2028")).toBe(false);
  });

  it("treats spaces around an IPv6 address the same with a prefix length", () => {
    expect(validateIPAddress("::1/64 ")).toBe(true);
    expect(validateIPAddress(" ::1/64")).toBe(true);
    expect(validateIPAddress("::1 /64")).toBe(false);
  });

  it("accepts IPv6 wildcard patterns with seven groups and :: at an end", () => {
    expect(validateIPAddress("::1:2:3:4:5:6:*", true)).toBe(true);
    expect(validateIPAddress("*:1:2:3:4:5:6::", true)).toBe(true);
    expect(validateIPAddress("::1:2:3:4:5:1.2.*.*", true)).toBe(true);
    expect(validateIPAddress("::1:2:3:4:5:6:7:*", true)).toBe(false);
    expect(validateIPAddress("1:2:3:4:5:6:7:8:*", true)).toBe(false);
  });

  it("rejects IPv4 wildcard octets that can't match any octet", () => {
    expect(validateIPAddress("3##.*.*.*", true)).toBe(false);
    expect(validateIPAddress("26#.*.*.*", true)).toBe(false);
    expect(validateIPAddress("9#9.1.1.1", true)).toBe(false);
    expect(validateIPAddress("0#.1.1.1", true)).toBe(false);
    expect(validateIPAddress("00*.1.1.1", true)).toBe(false);
    expect(validateIPAddress("25#.*.*.*", true)).toBe(true);
    expect(validateIPAddress("2##.*.*.*", true)).toBe(true);
    expect(validateIPAddress("1*.1.1.1", true)).toBe(true);
    expect(validateIPAddress("0*.1.1.1", true)).toBe(true);
    expect(validateIPAddress("???.1.1.1", true)).toBe(true);
  });

  it("checks long wildcard octets quickly", () => {
    const start = Date.now();
    expect(validateIPAddress("*".repeat(100000) + "1.1.1.1", true)).toBe(true);
    expect(validateIPAddress("*".repeat(100000) + "#".repeat(4) + ".1.1.1", true)).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
  });
});

describe("review fixes", () => {
  it("trims spaces around an IPv6 address in linear time", () => {
    const start = Date.now();
    expect(validateIPAddress("1:" + " ".repeat(100000) + "x")).toBe(false);
    expect(validateIPv4("1.2.3.4:" + " ".repeat(100000) + "x")).toBe(false);
    expect(validateIPv6(" ".repeat(100000) + "::1" + " ".repeat(100000))).toBe(true);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("rejects a U-label with any character that IDNA would map", () => {
    expect(validateDomain("\u00fc\uff41.de")).toBe(false); // fullwidth a
    expect(validateDomain("\u00fc\u00b2.de")).toBe(false); // superscript two
    expect(validateDomain("\u00fc\u017f.de")).toBe(false); // long s
    expect(validateDomain("\u00fc\u00bd.de")).toBe(false); // one half
    expect(validateDomain("a.\u00fc\uff21")).toBe(false); // fullwidth A
    expect(validateEmailAddress("u@\u00fc\uff41.de")).toBe(false);
    expect(validateDomain("stra\u00dfe.de")).toBe(true);
    expect(validateDomain("B\u00fccher.de")).toBe(true);
  });

  it("accepts a real internationalized domain in wildcard mode", () => {
    expect(validateDomain("b\u00fccher.de", true)).toBe(true);
    expect(validateDomain("*.b\u00fccher.de", true)).toBe(false);
  });

  it("trims only ASCII spaces around an email address", () => {
    expect(validateEmailAddress(" user@example.com ")).toBe(true);
    expect(validateEmailAddress("user@example.com\u2028")).toBe(false);
    expect(validateEmailAddress("\u2029user@example.com")).toBe(false);
    expect(validateEmailAddress("\ufeffuser@example.com")).toBe(false);
    expect(validateEmailAddress("\u00a0user@example.com")).toBe(false);
    expect(validateEmailAddress("user@example.com\u3000")).toBe(false);
    expect(validateEmailAddress("*@example.com\u2028", true)).toBe(false);
  });
});

describe("validateDomain top-level label (RFC 1123 section 2.1, RFC 3696 section 2)", () => {
  it("rejects an all-numeric last label", () => {
    expect(validateDomain("1.2.3.4")).toBe(false);
    expect(validateDomain("999.999.999.999")).toBe(false);
    expect(validateDomain("example.123")).toBe(false);
    expect(validateDomain("example.0")).toBe(false);
    expect(validateDomain("example.123.")).toBe(false);
  });

  it("still accepts digits elsewhere", () => {
    expect(validateDomain("123.example")).toBe(true);
    expect(validateDomain("example.a1")).toBe(true);
    expect(validateDomain("example.1a")).toBe(true);
  });

  it("rejects an all-numeric last label in wildcard mode, unless it has a wildcard", () => {
    expect(validateDomain("*.123", true)).toBe(false);
    expect(validateDomain("*.1", true)).toBe(false);
    expect(validateDomain("*.1*", true)).toBe(true);
    expect(validateDomain("*.1?", true)).toBe(true);
  });
});

describe("internationalized domain names (U-labels)", () => {
  it("accepts U-labels in validateDomain and in email domains", () => {
    expect(validateDomain("b\u00fccher.de")).toBe(true);
    expect(validateDomain("B\u00fccher.de")).toBe(true);
    expect(validateDomain("\u4f8b\u5b50.\u5e7f\u544a")).toBe(true);
    expect(validateEmailAddress("user@b\u00fccher.de")).toBe(true);
    expect(validateEmailAddress("\u7528\u6237@\u4f8b\u5b50.\u5e7f\u544a")).toBe(true);
    expect(validateEmailAddress("user@xn--bcher-kva.de")).toBe(true);
  });

  it("applies the label rules to the A-label form", () => {
    // 60 u-umlauts encode to an A-label far over 63 octets.
    expect(validateDomain("\u00fc".repeat(60) + ".de")).toBe(false);
    expect(validateDomain("-b\u00fccher.de")).toBe(false);
    expect(validateDomain("b\u00fccher-.de")).toBe(false);
    expect(validateDomain("b\u00fccher..de")).toBe(false);
    expect(validateDomain("b\u00fccher")).toBe(false);
    expect(validateDomain("b\u00fccher.123")).toBe(false);
    expect(validateDomain("ab--b\u00fccher.de")).toBe(false);
    expect(validateDomain("ab-b\u00fccher.de")).toBe(true);
  });

  it("rejects characters that are not letters, marks, digits or hyphens", () => {
    expect(validateDomain("b\u00fc cher.de")).toBe(false);
    expect(validateDomain("\ud83d\ude00.com")).toBe(false);
    expect(validateDomain("b\u00fccher_x.de")).toBe(false);
    expect(validateDomain("b\u00fccher.de/x")).toBe(false);
    expect(validateDomain("b\u00fccher.de:80")).toBe(false);
    expect(validateDomain("user@b\u00fccher.de")).toBe(false);
  });

  it("separates labels only with an ASCII dot", () => {
    expect(validateDomain("\u4f8b\u5b50\u3002\u5e7f\u544a")).toBe(false);
    expect(validateDomain("b\u00fccher\uff0ede")).toBe(false);
  });

  it("rejects labels that IDNA would map to something else", () => {
    // Fullwidth letters map to ASCII, and a decomposed u-umlaut is not in NFC.
    expect(validateDomain("\uff45\uff58\uff41\uff4d\uff50\uff4c\uff45.com")).toBe(false);
    expect(validateDomain("bu\u0308cher.de")).toBe(false);
  });

  it("keeps the trailing-dot difference between domain and email", () => {
    expect(validateDomain("b\u00fccher.de.")).toBe(true);
    expect(validateEmailAddress("user@b\u00fccher.de.")).toBe(false);
  });

  it("does not take U-labels in wildcard mode", () => {
    expect(validateDomain("*.b\u00fccher.de", true)).toBe(false);
  });
});

describe("validateEmailAddress wildcard patterns", () => {
  it("falls back to normal validation for real addresses that contain ? or *", () => {
    expect(validateEmailAddress("\"what?\"@example.com", true)).toBe(true);
    expect(validateEmailAddress("\"a b*\"@example.com", true)).toBe(true);
    expect(validateEmailAddress("user?@[192.0.2.1]", true)).toBe(true);
    expect(validateEmailAddress("user*@[IPv6:2001:db8::1]", true)).toBe(true);
    // Without wildcards these were valid already.
    expect(validateEmailAddress("\"what?\"@example.com")).toBe(true);
  });

  it("does not let the fallback accept something normal mode rejects", () => {
    expect(validateEmailAddress("\"what?\"@-example.com", true)).toBe(false);
    expect(validateEmailAddress("what?@", true)).toBe(false);
  });

  it("limits each domain label to 63 characters, not counting *", () => {
    expect(validateEmailAddress("*@" + "a".repeat(63) + ".com", true)).toBe(true);
    expect(validateEmailAddress("*@" + "a".repeat(64) + ".com", true)).toBe(false);
    expect(validateEmailAddress("*@*" + "a".repeat(63) + ".com", true)).toBe(true);
    expect(validateEmailAddress("*@" + "?".repeat(64) + ".com", true)).toBe(false);
  });

  it("rejects local-part patterns with misplaced dots", () => {
    expect(validateEmailAddress(".*@example.com", true)).toBe(false);
    expect(validateEmailAddress("*.@example.com", true)).toBe(false);
    expect(validateEmailAddress("a..*@example.com", true)).toBe(false);
    expect(validateEmailAddress("..*@example.com", true)).toBe(false);
    expect(validateEmailAddress("a.*@example.com", true)).toBe(true);
    expect(validateEmailAddress("*.b@example.com", true)).toBe(true);
  });

  it("rejects an all-numeric last domain label", () => {
    expect(validateEmailAddress("*@1.2.3.4", true)).toBe(false);
    expect(validateEmailAddress("*@example.123", true)).toBe(false);
    expect(validateEmailAddress("*@example.1*", true)).toBe(true);
  });

  it("treats # as a literal, so it can't appear in the domain", () => {
    expect(validateEmailAddress("a*@x#.com", true)).toBe(false);
    expect(validateEmailAddress("a#*@example.com", true)).toBe(true);
  });

  it("keeps the documented single-label pattern examples", () => {
    expect(validateEmailAddress("*@mdaemon???", true)).toBe(true);
    expect(validateEmailAddress("*@*", true)).toBe(true);
    expect(validateEmailAddress("*@*.mdaemon.com", true)).toBe(true);
    expect(validateEmailAddress("<script>@x*", true)).toBe(false);
  });
});
