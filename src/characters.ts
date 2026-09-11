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

/**
* Checks if a string contains any C0 control character (U+0000-U+001F) or DEL (U+007F).
*
* @param {string} str - The string to check.
* @returns {boolean} True if str contains control characters.
*/
export function hasControlCharacters(str: string): boolean {
  return typeof str === "string" && /[\x00-\x1f\x7f]/.test(str);
}

/**
* Validates if a given string consists solely of ASCII digits (0-9).
*
* Note: this is a non-negative, digits-only check. Leading zeros (e.g. "007")
* are accepted and a leading minus sign (e.g. "-5") is rejected; it does not
* validate the numeric range of a true integer.
*
* @param {string} value - The string value to validate.
* @returns {boolean} True if the string is one or more ASCII digits, false otherwise.
*/
export function validateInt(value: string): boolean {
  if (typeof value !== "string" || value.length < 1) {
      return false;
  }

  return /^\d+$/.test(value);
}

/**
* Checks if a string contains any uppercase characters.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains uppercase characters, false otherwise.
*/
export function hasUpperCase(str: string): boolean {
  if (typeof str !== "string") {
      return false;
  }
  return /[A-Z]+/.test(str);
}

/**
* Checks if a string contains any lowercase characters.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains lowercase characters, false otherwise.
*/
export function hasLowerCase(str: string): boolean {
  if (typeof str !== "string") {
      return false;
  }
  return /[a-z]+/.test(str);
}

/**
* Checks if a string contains any numbers.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains numbers, false otherwise.
*/
export function hasNumber(str: string): boolean {
  if (typeof str !== "string") {
      return false;
  }
  return /[0-9]+/.test(str);
}

/**
* Checks if the given string contains any special characters.
* Returns false if the input is not a string.
*/
export function hasSpecial(str: string): boolean {
  if (typeof str !== "string") {
      return false;
  }
  return /[!-/]+|[:-@]+|[[-`]+|[{-~]/.test(str);
}
