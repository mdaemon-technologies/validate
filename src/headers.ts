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

// RFC 9110 §5.1: field-name = token = 1*tchar, where tchar is
// "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA.
const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

// RFC 9110 §5.5: field-value = *field-content, built from HTAB, SP, VCHAR and
// obs-text (U+0080-U+00FF), the same characters node:http allows. Anything above
// U+00FF is rejected: written as latin1, U+010D U+010A would become CR LF.
const HEADER_VALUE = /^[\t\x20-\x7e\x80-\xff]*$/;

/**
* Validates that a header name is an RFC 9110 token: one or more letters,
* digits or the symbols ! # $ % & ' * + - . ^ _ ` | ~, in any order.
*
* @param {string} name - The header name to validate
* @returns {boolean} True if the header name is valid
*/
export function validateHeaderName(name: string): boolean {
  return typeof name === "string" && HEADER_NAME.test(name);
}

/**
* Validates that a header value contains only HTAB, U+0020-U+007E and
* U+0080-U+00FF. Any other control character (CR, LF, NUL, ...), DEL and
* anything above U+00FF are rejected. An empty value is valid, and so are
* leading and trailing spaces or tabs.
*
* @param {string} value - The header value to validate
* @returns {boolean} True if the header value is valid
*/
export function validateHeaderValue(value: string): boolean {
  return typeof value === "string" && HEADER_VALUE.test(value);
}

/**
* Validates a header field line, "name:value" (RFC 9112 §5.1). The name must be
* a token that starts the line and ends at the colon, with no whitespace
* before or after it. The value may be empty, and may have spaces or tabs (OWS)
* around it. Nothing is trimmed, so a CR, LF or any other character outside
* the allow-lists is rejected wherever it appears.
*
* @param {string} header - The header string to validate
* @returns {boolean} True if the header contains a valid name and value
*/
export function validateHeader(header: string): boolean {
  if (typeof header !== "string") {
      return false;
  }

  const colon = header.indexOf(":");
  // The value's allow-list includes SP and HTAB, so the OWS around the value
  // needs no stripping: it is valid exactly when the stripped value is.
  return colon !== -1 &&
      validateHeaderName(header.substring(0, colon)) &&
      validateHeaderValue(header.substring(colon + 1));
}
