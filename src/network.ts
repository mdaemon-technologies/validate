/*
*    Copyright (C) 1998-2026  MDaemon Technologies, Ltd.
*
*    This library is free software; you can redistribute it and/or
*    modify it under the terms of the GNU Lesser General Public
*    License as published by the Free Software Foundation; either
*    version 2.1 of the License, or (at your option) any later version.
*
*    This library is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*    Lesser General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public
*    License along with this library; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
*    USA
*/

import { hasControlCharacters } from "./characters";
import { HYPHENATED_ALPHANUMERIC } from "./patterns";

// IP and domain wildcards: "?" matches one character, "#" one digit, "*" any
// number of characters. Email patterns use only "*" and "?".
const WILDCARD_CHARS = /[*?#]/;
const WILDCARD_DOMAIN_LABEL = /^[A-Za-z0-9*?#](?:[A-Za-z0-9*?#-]*[A-Za-z0-9*?#])?$/;

const IPV4_OCTET = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV4_PREFIX = /\/(?:3[0-2]|[12]?\d)$/;
// At most three digits, leading zeros allowed ("/064").
const IPV6_PREFIX = /\/(?=\d{1,3}$)0*(?:12[0-8]|1[01]\d|[1-9]?\d)$/;

// An email local part: a dot-atom, or a quoted string. In a quoted string, a
// quoted pair (RFC 5321: a backslash and any printable ASCII character) lets
// '"' and "\" appear.
const EMAIL_LOCAL_PART = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|"(?:[^"\\]|\\[\x20-\x7e])+")$/;
// RFC 5321 allows leading zeros in an address literal's octets ("[001.2.3.4]").
const EMAIL_IPV4_LITERAL = /^\[(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3}\]$/;
// Only address characters, so validateIPv6 never sees the prefix length, zone ID
// or surrounding whitespace that validateIPAddress accepts.
const EMAIL_IPV6_LITERAL = /^\[IPv6:([\dA-F:.]+)\]$/i;
const ALL_DIGITS = /^\d+$/;
const NON_ASCII = /[^\x00-\x7f]/;
// What a label may hold before IDNA checks it: letters, combining marks, digits
// and inner hyphens. RFC 5891 section 4.2.3.1 also bars "--" in the third and
// fourth positions of a U-label, which toALabels checks.
const U_LABEL_CHARACTERS = /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}-]*[\p{L}\p{M}\p{N}])?$/u;
// An email wildcard pattern: dot-separated runs of anything but specials and dots,
// "@", then the domain, which isEmailPattern checks label by label.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\.,;:"]+(?:\.[^\s@<>()[\]\\.,;:"]+)*@[^\s@<>()[\]\\,;:"]+$/;
// Like WILDCARD_DOMAIN_LABEL, but "#" is not an email wildcard.
const EMAIL_WILDCARD_LABEL = /^[A-Za-z0-9*?](?:[A-Za-z0-9*?-]*[A-Za-z0-9*?])?$/;
// RFC 5321 sections 4.5.3.1.1 and 4.5.3.1.3, in UTF-8 octets (RFC 6531 section 3.3).
const MAX_LOCAL_PART = 64;
const MAX_ADDRESS = 254;
// U+0080 to U+009F. hasControlCharacters covers only C0 and DEL, because C1
// characters are legal in Windows names, HTTP obs-text and LDAP values.
const C1_CONTROL = /[\x80-\x9f]/;

/**
* Validates if an email address is valid.
* The domain part is a host name that passes validateDomain (with no trailing dot),
* or an IPv4 or IPv6 address literal. The length limits (64 for the local part,
* 254 in all) count UTF-8 octets.
* Supports wildcard matching if useWildCards is true; a real address that contains
* a wildcard character is still valid.
* Rejects any control character (C0, DEL or C1), including a leading or trailing
* CR, LF or tab.
*
* @param {string} email - The email address to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the email is valid
*/
export function validateEmailAddress(email: string, useWildCards: boolean | null = false): boolean {
  if (typeof email !== "string") {
      return false;
  }

  // Control characters (CR/LF in particular) are never valid, even inside a quoted
  // local part or at the ends, where trim() would otherwise hide them. RFC 6530
  // section 10.1 prohibits the C1 controls in mailbox names as well as the C0 ones.
  // A lone surrogate can't be encoded as UTF-8 (RFC 6532 section 3.1).
  if (hasControlCharacters(email) || C1_CONTROL.test(email) || hasLoneSurrogate(email)) {
      return false;
  }

  // RFC 5321 caps an address at 254 octets, and RFC 6531 counts them in UTF-8.
  // Every character is at least one octet, so the cheap length check comes first;
  // together they bound the work done on hostile input. Only ASCII spaces are
  // trimmed: the caller keeps the untrimmed string, and other whitespace, such as
  // U+2028 (a JavaScript line terminator), doesn't belong in a stored address.
  const address = trimSpaces(email);
  if (address.length > MAX_ADDRESS || utf8Length(address) > MAX_ADDRESS) {
      return false;
  }

  // Email patterns only use the "*" and "?" wildcards; "#" is a legal local-part
  // character. A real address that contains them is still valid as itself.
  if (useWildCards && /[*?]/.test(address) && isEmailPattern(address)) {
      return true;
  }

  // A quoted local part may contain "@", so the domain starts after the last one.
  const at = address.lastIndexOf("@");
  const localPart = address.slice(0, at);
  return at > 0 && utf8Length(localPart) <= MAX_LOCAL_PART &&
      EMAIL_LOCAL_PART.test(localPart) &&
      isEmailDomain(address.slice(at + 1));
}

/** Removes leading and trailing U+0020 spaces, in linear time. */
function trimSpaces(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text.charCodeAt(start) === 0x20) {
      start++;
  }
  while (end > start && text.charCodeAt(end - 1) === 0x20) {
      end--;
  }
  return text.slice(start, end);
}

/**
 * Whether a string has a high surrogate not followed by a low one, or a low one
 * not preceded by a high one. A loop, because regex lookbehind would stop the
 * browser bundle from loading in older Safari.
 */
function hasLoneSurrogate(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
          const next = text.charCodeAt(i + 1);
          if (!(next >= 0xdc00 && next <= 0xdfff)) {
              return true;
          }
          i++;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
          return true;
      }
  }
  return false;
}

/** The length of a string in UTF-8 octets. The string must have no lone surrogates. */
function utf8Length(text: string): number {
  let octets = 0;
  for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
          // A surrogate pair: one code point above U+FFFF, four octets.
          octets += 4;
          i++;
      } else {
          octets += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
      }
  }
  return octets;
}

/**
 * Checks the address in an "[IPv6:...]" literal against RFC 5321 section 4.1.3,
 * which is stricter than RFC 4291: a "::" may stand beside at most 6 other groups,
 * or 4 before an IPv4 part, so it always replaces at least two groups. Unlike
 * validateIPv6, the IPv4 part may have leading zeros, as in "[001.2.3.4]".
 */
function isEmailIPv6(address: string): boolean {
  const tailStart = address.lastIndexOf(":") + 1;
  const ipv4 = address.slice(tailStart);
  let ip = address;
  if (ipv4.includes(".")) {
      if (!EMAIL_IPV4_LITERAL.test("[" + ipv4 + "]")) {
          return false;
      }
      ip = address.slice(0, tailStart) + ipv4.split(".").map(octet => String(Number(octet))).join(".");
  }
  if (!validateIPv6(ip)) {
      return false;
  }
  const groups = address.split(":").filter(group => group !== "" && !group.includes(".")).length;
  return !address.includes("::") || groups <= (ipv4.includes(".") ? 4 : 6);
}

/**
 * Checks the shape of an email wildcard pattern: an unquoted local part with no
 * leading, trailing or doubled dot, and a domain of letters, digits, hyphens and
 * wildcards whose labels are at most 63 characters and whose last label is not
 * all digits. A single-label domain ("*@mdaemon???") is allowed.
 */
function isEmailPattern(pattern: string): boolean {
  if (!EMAIL_PATTERN.test(pattern)) {
      return false;
  }
  const at = pattern.indexOf("@");
  const labels = pattern.slice(at + 1).split(".");
  return utf8Length(pattern.slice(0, at).replace(/\*/g, "")) <= MAX_LOCAL_PART &&
      !ALL_DIGITS.test(labels[labels.length - 1]) &&
      labels.every(label => EMAIL_WILDCARD_LABEL.test(label) && fixedLength(label) <= 63);
}

/** The length of a name or pattern, not counting "*", which matches any number of characters. */
function fixedLength(text: string): number {
  return text.replace(/\*/g, "").length;
}

/**
 * Checks the domain part of an email address: an IPv4 or IPv6 address literal
 * ("[192.0.2.1]", "[IPv6:2001:db8::1]"), or a host name that passes
 * validateDomain and has no trailing dot.
 */
function isEmailDomain(domain: string): boolean {
  const ipv6 = EMAIL_IPV6_LITERAL.exec(domain);
  if (ipv6) {
      return isEmailIPv6(ipv6[1]);
  }
  if (domain.startsWith("[")) {
      return EMAIL_IPV4_LITERAL.test(domain);
  }
  return !domain.endsWith(".") && validateDomain(domain);
}

/**
* Validates if a domain string is valid.
* Labels are letters, digits and inner hyphens, or U-labels ("bücher"), which
* are checked in their A-label ("xn--") form. The last label is not all digits.
* Supports wildcard matching if useWildCards is true; patterns are ASCII only.
*
* @param {string} domain - The domain to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the domain is valid
*/
export function validateDomain(domain: string, useWildCards: boolean | null = false): boolean {
  if (typeof domain !== "string") {
      return false;
  }

  // A single trailing dot denotes the DNS root and is allowed.
  const root = domain.endsWith(".") ? "." : "";
  const name = root ? domain.slice(0, -1) : domain;

  // U-labels are checked in their A-label ("xn--") form, which is what the
  // length limits apply to (RFC 5890 section 2.3.2.1).
  if ((!useWildCards || !WILDCARD_CHARS.test(name)) && NON_ASCII.test(name)) {
      const aLabels = toALabels(name);
      return aLabels !== null && validateDomain(aLabels + root);
  }

  // The last label is never all digits (RFC 1123 section 2.1), so a domain can't
  // be mistaken for an IPv4 address.
  const labels = name.split(".");
  if (fixedLength(name) > 253 || labels.length < 2 || ALL_DIGITS.test(labels[labels.length - 1])) {
      return false;
  }

  const labelPattern = useWildCards ? WILDCARD_DOMAIN_LABEL : HYPHENATED_ALPHANUMERIC;
  return labels.every(label => labelPattern.test(label) && fixedLength(label) <= 63);
}

/**
 * Converts a domain name with U-labels to A-labels with the URL parser's IDNA
 * processing, or returns null. Each label must be letters, marks, digits and
 * hyphens in NFC, separated by ASCII dots. A label that IDNA would map to other
 * characters, such as fullwidth letters, is rejected; only case is folded.
 */
function toALabels(name: string): string | null {
  const labels = name.split(".");
  // IDNA2008 disallows characters that NFKC changes (RFC 5892, "Unstable"),
  // such as fullwidth letters, superscripts and fractions.
  const isULabel = (label: string) => U_LABEL_CHARACTERS.test(label) &&
      !(NON_ASCII.test(label) && (label.slice(2, 4) === "--" || label.normalize("NFKC") !== label));
  if (name.normalize("NFC") !== name || !labels.every(isULabel)) {
      return null;
  }

  let host: string;
  try {
      host = new URL("http://" + name + "/").hostname;
  } catch {
      return null;
  }

  const converted = host.split(".");
  const unchanged = converted.length === labels.length && converted.every((label, i) =>
      NON_ASCII.test(labels[i]) ? label.startsWith("xn--") : label === labels[i].toLowerCase());
  return unchanged ? host : null;
}

/**
* Validates if an IP address string is valid.
* Supports IPv4, IPv6, and wildcard matching if useWildCards is true.
* Rejects any control character, including a leading or trailing CR, LF or tab.
*
* @param {string} ip - The IP address to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the IP address is valid
*/
export function validateIPAddress(ip: string, useWildCards: boolean | null = false): boolean {
  if (typeof ip !== "string" || hasControlCharacters(ip)) {
      return false;
  }

  if (useWildCards && WILDCARD_CHARS.test(ip)) {
      const isIPv6 = ip.includes(":");
      // A CIDR prefix length is not part of the pattern's shape; an invalid one is left in place and fails.
      const pattern = ip.replace(isIPv6 ? IPV6_PREFIX : IPV4_PREFIX, "");
      return isIPv6 ? isIPv6WildcardPattern(pattern) : isIPv4WildcardPattern(pattern);
  }

  if (ip.includes(":")) {
      // An IPv6 address may have ASCII spaces around it (an IPv4 address may not),
      // but not between the address and its prefix length.
      ip = trimSpaces(ip);
      // Strip a valid prefix length; an out-of-range one is left in place and fails below.
      if (IPV6_PREFIX.test(ip)) {
          ip = ip.substring(0, ip.lastIndexOf("/"));
      }
  }

  const re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%[\w.-]+)?$|^(((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\/(3[012]|[12]?[0-9])))$/;
  return re.test(ip);
}

/**
 * Checks an IPv4 wildcard pattern: four octets, each either a plain 0-255 value
 * or digits and wildcards that can match at least one such value.
 */
function isIPv4WildcardPattern(ip: string): boolean {
  const octets = ip.split(".");
  return octets.length === 4 && octets.every(octet =>
      WILDCARD_CHARS.test(octet) ? canMatchOctet(octet) : IPV4_OCTET.test(octet));
}

/**
 * Whether an octet pattern of digits and wildcards matches some value from 0 to
 * 255 written without leading zeros. "3##" (300-399) and "0#" can't.
 */
function canMatchOctet(octet: string): boolean {
  if (!/^[\d*?#]+$/.test(octet) || fixedLength(octet) > 3) {
      return false;
  }
  // At most three fixed positions and four "*" runs, so the regex stays tiny.
  const source = octet.replace(/\*+/g, "*").replace(/\*/g, "\\d*").replace(/[?#]/g, "\\d");
  const pattern = new RegExp("^" + source + "$");
  for (let value = 0; value <= 255; value++) {
      if (pattern.test(String(value))) {
          return true;
      }
  }
  return false;
}

/**
 * Checks an IPv6 wildcard pattern: hex digits, colons and wildcards, 2-7 colons,
 * at most one "::", no lone leading or trailing colon, and at most four
 * fixed-width positions per group. An IPv4-mapped tail ("::ffff:10.*.*.*") is
 * checked as an IPv4 pattern and stands for the last two groups.
 */
function isIPv6WildcardPattern(ip: string): boolean {
  let hex = ip;
  if (ip.includes(".")) {
      const tailStart = ip.lastIndexOf(":") + 1;
      if (!isIPv4WildcardPattern(ip.slice(tailStart))) {
          return false;
      }
      hex = ip.slice(0, tailStart) + "0:0";
  }

  const groups = hex.split(":");
  // A "::" at either end splits off an extra empty string that is not a group.
  const edges = (hex.startsWith("::") ? 1 : 0) + (hex.endsWith("::") ? 1 : 0);
  return /^[\dA-Fa-f:*?#]+$/.test(hex) &&
      groups.length >= 3 && groups.length - edges <= 8 &&
      !hex.includes(":::") && hex.split("::").length <= 2 &&
      !/^:[^:]|[^:]:$/.test(hex) &&
      groups.every(group => group.replace(/\*/g, "").length <= 4);
}


/**
 * Validates if a given IPv4 address is valid.
 *
 * @param ip - The IPv4 address to validate.
 * @returns {boolean} True if the IPv4 address is valid, false otherwise.
 */
export function validateIPv4(ip: string): boolean {
    return validateIPAddress(ip, false) && !ip.includes(":");
}

/**
 * Validates if a given IPv6 address is valid, including IPv4-mapped forms such as "::ffff:1.2.3.4".
 *
 * @param {string} ip - The IPv6 address to validate.
 * @returns {boolean} True if the IPv6 address is valid, false otherwise.
 */
export function validateIPv6(ip: string): boolean {
    return validateIPAddress(ip, false) && ip.includes(":");
}
