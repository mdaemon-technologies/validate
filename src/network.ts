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
// or surrounding whitespace that validateIPAddress accepts. validateIPv6 rejects
// leading zeros in an embedded IPv4 part ("::ffff:001.2.3.4").
const EMAIL_IPV6_LITERAL = /^\[IPv6:([\dA-F:.]+)\]$/i;
const ALL_DIGITS = /^\d+$/;

/**
* Validates if an email address is valid.
* The domain part is a host name that passes validateDomain (with no trailing dot
* and a last label that is not all digits), or an IPv4 or IPv6 address literal.
* Supports wildcard matching if useWildCards is true.
* Rejects any control character, including a leading or trailing CR, LF or tab.
*
* @param {string} email - The email address to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the email is valid
*/
export function validateEmailAddress(email: string, useWildCards: boolean | null = false): boolean {
  if (typeof email !== "string") {
      return false;
  }

  // RFC 5321 caps an address at 254 characters. The check also bounds the work
  // done on hostile input.
  if (email.length > 254) {
      return false;
  }

  // Control characters (CR/LF in particular) are never valid, even inside a quoted
  // local part or at the ends, where trim() would otherwise hide them.
  if (hasControlCharacters(email)) {
      return false;
  }

  // Email patterns only use the "*" and "?" wildcards; "#" is a legal local-part character.
  if (useWildCards && /[*?]/.test(email)) {
      const pattern = email.trim();
      if (!/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+$/.test(pattern)) {
          return false;
      }
      const domainPart = pattern.slice(pattern.indexOf("@") + 1);
      return domainPart.split(".").every(label => WILDCARD_DOMAIN_LABEL.test(label));
  }

  const address = email.trim();
  // A quoted local part may contain "@", so the domain starts after the last one.
  const at = address.lastIndexOf("@");
  return at > 0 &&
      EMAIL_LOCAL_PART.test(address.slice(0, at)) &&
      isEmailDomain(address.slice(at + 1));
}

/**
 * Checks the domain part of an email address: an IPv4 or IPv6 address literal
 * ("[192.0.2.1]", "[IPv6:2001:db8::1]"), or a host name that follows
 * validateDomain's label rules, has no trailing dot, and does not end in an
 * all-numeric label (RFC 3696), so "1.2.3.4" needs its brackets.
 */
function isEmailDomain(domain: string): boolean {
  const ipv6 = EMAIL_IPV6_LITERAL.exec(domain);
  if (ipv6) {
      return validateIPv6(ipv6[1]);
  }
  if (domain.startsWith("[")) {
      return EMAIL_IPV4_LITERAL.test(domain);
  }
  return !domain.endsWith(".") &&
      !ALL_DIGITS.test(domain.slice(domain.lastIndexOf(".") + 1)) &&
      validateDomain(domain);
}

/**
* Validates if a domain string is valid.
* Supports wildcard matching if useWildCards is true.
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
  const name = domain.endsWith(".") ? domain.slice(0, -1) : domain;
  const labels = name.split(".");
  // "*" matches any number of characters, so it does not count toward the length limits.
  const fixedLength = (text: string) => text.replace(/\*/g, "").length;
  if (fixedLength(name) > 253 || labels.length < 2) {
      return false;
  }

  const labelPattern = useWildCards ? WILDCARD_DOMAIN_LABEL : HYPHENATED_ALPHANUMERIC;
  return labels.every(label => labelPattern.test(label) && fixedLength(label) <= 63);
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
  // The IPv6 pattern allows surrounding whitespace, which would let a CR or LF through.
  if (typeof ip !== "string" || hasControlCharacters(ip)) {
      return false;
  }

  if (useWildCards && WILDCARD_CHARS.test(ip)) {
      const isIPv6 = ip.includes(":");
      // A CIDR prefix length is not part of the pattern's shape; an invalid one is left in place and fails.
      const pattern = ip.replace(isIPv6 ? IPV6_PREFIX : IPV4_PREFIX, "");
      return isIPv6 ? isIPv6WildcardPattern(pattern) : isIPv4WildcardPattern(pattern);
  }

  // Strip a valid IPv6 prefix length; an out-of-range one is left in place and fails below.
  if (ip.includes(":") && IPV6_PREFIX.test(ip)) {
      ip = ip.substring(0, ip.lastIndexOf("/"));
  }

  const re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%[\w.-]+)?\s*$|^(((2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)\.){3}(2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)(\/(3[012]|[12]?[0-9])))$/;
  return re.test(ip);
}

/**
 * Checks an IPv4 wildcard pattern: four octets, each either a plain 0-255 value
 * or digits and wildcards with at most three fixed-width ("?" or "#") positions.
 */
function isIPv4WildcardPattern(ip: string): boolean {
  const octets = ip.split(".");
  return octets.length === 4 && octets.every(octet =>
      WILDCARD_CHARS.test(octet)
          ? /^[\d*?#]+$/.test(octet) && octet.replace(/\*/g, "").length <= 3
          : IPV4_OCTET.test(octet));
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
  return /^[\dA-Fa-f:*?#]+$/.test(hex) &&
      groups.length >= 3 && groups.length <= 8 &&
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
