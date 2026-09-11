/*
*    Copyright (C) 1998-2023  MDaemon Technologies, Ltd.
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

/**
* Validates that a header name is a valid string without control characters
* and only contains alphanumeric characters or hyphens, with no leading/trailing hyphens.
*
* @param {string} name - The header name to validate
* @returns {boolean} True if the header name is valid
*/
export function validateHeaderName(name: string): boolean {
  return typeof name === "string" && HYPHENATED_ALPHANUMERIC.test(name);
}

/**
* Validates that a header value string does not contain control characters.
*
* @param {string} value - The header value to validate
* @returns {boolean} True if the header value is valid without control characters
*/
export function validateHeaderValue(value: string): boolean {
  return typeof value === "string" && !!value.length && !hasControlCharacters(value);
}

/**
* Validates that a header string contains a valid name and value.
*
* @param {string} header - The header string to validate
* @returns {boolean} True if the header contains a valid name and value
*/
export function validateHeader(header: string): boolean {
  if (typeof header !== "string" || header.indexOf(":") === -1) {
      return false;
  }

  const name = header.substring(0, header.indexOf(":")).trim();
  const value = header.substring(header.indexOf(":") + 1).trim();
  return validateHeaderName(name) && validateHeaderValue(value);
}
