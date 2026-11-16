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

// An RFC 4514 distinguished name, read by an index-based scanner rather than one
// regex, so it runs in linear time and never recurses:
//
//   distinguishedName = rdn *( "," rdn )
//   rdn               = attributeType "=" attributeValue *( "+" attributeType "=" attributeValue )
//   attributeType     = descr / numericoid                      (RFC 4512 section 1.4)
//   attributeValue    = string / "#" 1*hexpair
//
// Deliberate leniencies (RFC 2253 section 4 lets parsers accept more): spaces are
// allowed around "=", ",", and "+", which also lets a value start or end with an
// unescaped space; and a value may be empty. The empty DN is rejected, and so is any
// raw control character (an escaped one, such as "\00", is fine).

const SPACE = 0x20;
const DQUOTE = 0x22;
const SHARP = 0x23;
const PLUS = 0x2b;
const COMMA = 0x2c;
const HYPHEN = 0x2d;
const DOT = 0x2e;
const ZERO = 0x30;
const SEMI = 0x3b;
const LANGLE = 0x3c;
const EQUALS = 0x3d;
const RANGLE = 0x3e;
const ESC = 0x5c;

function isAlpha(c: number): boolean {
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
}

function isDigit(c: number): boolean {
  return c >= 0x30 && c <= 0x39;
}

// Scans an attributeType: an RFC 4512 descr (ALPHA *( ALPHA / DIGIT / HYPHEN )) or
// numericoid (number 1*( DOT number ), where a number has no leading zero). Returns the
// index just past it, or -1. Hand-written, because V8 runs out of stack on a repeated
// regex group over a multi-megabyte OID.
function scanAttributeType(str: string, i: number): number {
  let c = str.charCodeAt(i);
  if (isAlpha(c)) {
    do {
      c = str.charCodeAt(++i);
    } while (isAlpha(c) || isDigit(c) || c === HYPHEN);
    return i;
  }
  let numbers = 0;
  for (;;) {
    if (!isDigit(c)) return -1;
    const start = i;
    do {
      c = str.charCodeAt(++i);
    } while (isDigit(c));
    if (str.charCodeAt(start) === ZERO && i - start > 1) return -1; // leading zero
    numbers++;
    if (c !== DOT) break;
    c = str.charCodeAt(++i);
  }
  return numbers > 1 ? i : -1;
}

// The value of a hex digit, or -1 (also for NaN, past the end of the string).
function hexValue(c: number): number {
  if (isDigit(c)) return c - ZERO;
  if (c >= 0x41 && c <= 0x46) return c - 0x37;
  if (c >= 0x61 && c <= 0x66) return c - 0x57;
  return -1;
}

// The characters a backslash may escape directly: RFC 4514 <special> and ESC.
function isSpecial(c: number): boolean {
  return c === DQUOTE || c === PLUS || c === COMMA || c === SEMI || c === LANGLE ||
    c === RANGLE || c === SPACE || c === SHARP || c === EQUALS || c === ESC;
}

function skipSpaces(str: string, i: number): number {
  while (str.charCodeAt(i) === SPACE) i++;
  return i;
}

// Scans "#" 1*hexpair from just after the "#". Returns the index of the separator
// ("," or "+") or the end of the string, or -1 if the value is malformed.
function scanHexString(str: string, i: number): number {
  const start = i;
  while (hexValue(str.charCodeAt(i)) >= 0) i++;
  const digits = i - start;
  if (digits === 0 || digits % 2 !== 0) return -1;
  i = skipSpaces(str, i);
  return i === str.length || str.charCodeAt(i) === COMMA || str.charCodeAt(i) === PLUS ? i : -1;
}

// Scans a <string> value. Returns the index of the unescaped separator ("," or "+") or
// the end of the string, or -1 if the value is malformed. The octets written as hex
// escapes must form well-formed UTF-8 (RFC 3629), since RFC 4514 section 3 restricts
// the DN to UTF-8, and a literal character or the end of the value must not interrupt
// a multi-byte sequence. Literal characters must be well-formed UTF-16.
function scanString(str: string, i: number): number {
  const n = str.length;
  let pending = 0; // continuation bytes still expected
  let lower = 0x80; // allowed range of the next continuation byte
  let upper = 0xbf;
  while (i < n) {
    const c = str.charCodeAt(i);
    if (c === COMMA || c === PLUS) {
      break;
    }
    if (c === ESC) {
      const high = hexValue(str.charCodeAt(i + 1));
      const low = hexValue(str.charCodeAt(i + 2));
      if (high >= 0 && low >= 0) {
        const byte = high * 16 + low;
        i += 3;
        if (pending > 0) {
          if (byte < lower || byte > upper) return -1;
          pending--;
          lower = 0x80;
          upper = 0xbf;
        } else if (byte >= 0xc2 && byte <= 0xdf) {
          pending = 1;
        } else if (byte >= 0xe0 && byte <= 0xef) {
          pending = 2;
          if (byte === 0xe0) lower = 0xa0; // no overlong forms
          if (byte === 0xed) upper = 0x9f; // no surrogates
        } else if (byte >= 0xf0 && byte <= 0xf4) {
          pending = 3;
          if (byte === 0xf0) lower = 0x90; // no overlong forms
          if (byte === 0xf4) upper = 0x8f; // nothing above U+10FFFF
        } else if (byte >= 0x80) {
          return -1; // a continuation byte or an invalid lead byte
        }
        continue;
      }
      if (pending > 0 || !isSpecial(str.charCodeAt(i + 1))) return -1;
      i += 2;
      continue;
    }
    if (pending > 0 || c === DQUOTE || c === SEMI || c === LANGLE || c === RANGLE) {
      return -1;
    }
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return -1;
      i += 2;
      continue;
    }
    if (c >= 0xdc00 && c <= 0xdfff) {
      return -1;
    }
    i++;
  }
  return pending > 0 ? -1 : i;
}

/**
* Validates if a given string is a valid LDAP distinguished name (DN), as defined
* by RFC 4514. Accepts spaces around "=", "," and "+" and empty attribute values;
* rejects the empty DN and any control character.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid LDAP DN, false otherwise.
*/
export function validateLdapDN(str: string): boolean {
  if (typeof str !== "string" || hasControlCharacters(str)) {
      return false;
  }
  const n = str.length;
  let i = skipSpaces(str, 0);
  if (i === n) {
      return false;
  }
  for (;;) {
    i = scanAttributeType(str, i);
    if (i < 0) {
        return false;
    }
    i = skipSpaces(str, i);
    if (str.charCodeAt(i) !== EQUALS) {
        return false;
    }
    i = skipSpaces(str, i + 1);
    i = str.charCodeAt(i) === SHARP ? scanHexString(str, i + 1) : scanString(str, i);
    if (i < 0) {
        return false;
    }
    if (i === n) {
        return true;
    }
    // i is at an unescaped "," or "+"; another attributeTypeAndValue must follow.
    i = skipSpaces(str, i + 1);
  }
}
