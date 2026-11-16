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

// Grammar (after trimming surrounding ASCII spaces), where SEP is one space or hyphen:
//   number = [ "+" ] ( run | [ run [SEP] ] group [SEP] run )
//   run    = digits *( SEP digits )
//   group  = "(" digits ")"
// A "+" must be followed by a digit from 1 to 9. Separators never lead, trail or repeat,
// because each one must sit between two digits or beside the group.
//
// Linear time: a separator inside a run must be followed by a digit, so a run splits only
// one way, and the input is capped at MAX_LENGTH before the regex runs. Keep the cap: on
// inputs of a few million characters V8's regex backtracking stack overflows and throws.
const RUN = String.raw`\d+(?:[ -]\d+)*`;
const GROUP = String.raw`\(\d+\)`;
const PHONE_NUMBER = new RegExp(String.raw`^(?:\+(?=[1-9]))?(?:${RUN}|(?:${RUN}[ -]?)?${GROUP}[ -]?${RUN})$`);

const MIN_DIGITS = 5;
const MAX_DIGITS = 15; // the ITU-T E.164 maximum

// The longest valid number, "+1 (2) 3 4 5 6 7 8 9 0 1 2 3 4 5": 15 digits, "+", the
// parentheses and one separator in each of the 14 gaps between digits.
const MAX_LENGTH = 32;

/**
* Validates if a given string is a valid phone number.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid phone number, false otherwise.
*/
export function validatePhoneNumber(str: string): boolean {
  if (typeof str !== "string") {
    return false;
  }

  let start = 0;
  let end = str.length;
  while (start < end && str.charCodeAt(start) === 32) {
    start++;
  }
  while (end > start && str.charCodeAt(end - 1) === 32) {
    end--;
  }
  if (end - start > MAX_LENGTH) {
    return false;
  }

  const phone = str.slice(start, end);
  if (!PHONE_NUMBER.test(phone)) {
    return false;
  }

  let digits = 0;
  for (let i = 0; i < phone.length; i++) {
    const code = phone.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      digits++;
    }
  }
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS;
}
