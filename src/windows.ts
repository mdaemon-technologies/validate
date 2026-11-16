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

// Segments are separated by single backslashes that the segment class cannot
// match, which keeps these linear-time (the previous form backtracked exponentially).
const WINDOWS_PATH = /^(?:[A-Za-z]:\\|\\\\)[^"*:<>?\/\\|]+(?:\\[^"*:<>?\/\\|]+)*$/;
const WINDOWS_PATH_WILDCARD = /^(?:[A-Za-z]:\\|\\\\)[^":<>\/\\|]+(?:\\[^":<>\/\\|]+)*$/;

// Reserved device names, in any case and with any extension ("nul.txt" is NUL).
// Windows treats the superscript digits ¹ ² ³ as digits here; COM0 and LPT0 are not reserved.
const DEVICE_NAME = /^(?:CON|PRN|AUX|NUL|COM[1-9\u00b9\u00b2\u00b3]|LPT[1-9\u00b9\u00b2\u00b3]) *(?:\.|$)/i;

const MAX_NAME_LENGTH = 255;
const MAX_PATH_LENGTH = 32767;

/** The length of a name or pattern; in wildcard mode "*" is not counted, as it matches any number of characters. */
function fixedLength(text: string, useWildCards: boolean): number {
  return useWildCards ? text.replace(/\*/g, "").length : text.length;
}

/**
 * Checks one file or directory name: 1-255 characters, not a reserved device
 * name, and not ending in a period or a space (U+0020), which Windows strips.
 * That also rejects names made only of periods and spaces, such as "." and "..".
 */
function isValidName(name: string, useWildCards: boolean): boolean {
  return name.length > 0 && fixedLength(name, useWildCards) <= MAX_NAME_LENGTH &&
      !name.endsWith(".") && !name.endsWith(" ") && !DEVICE_NAME.test(name);
}

/** Whether a path segment is the current (".") or parent ("..") directory specifier. */
function isDotSpecifier(name: string): boolean {
  return name === "." || name === "..";
}

/**
* Validates if a given string is a valid Windows file name.
* Rejects reserved characters, control characters, reserved device names
* (CON, NUL, COM1, ...), names that end in a period or a space, and names longer than 255 characters.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if valid, false otherwise.
*/
export function validateWindowsFileName(str: string): boolean {
  return typeof str === "string" && !hasControlCharacters(str) && !/["*:<>?\/\\|]/.test(str) &&
      isValidName(str, false);
}

/**
* Validates if a given string is a valid Windows file path.
* Accepts only fully qualified paths: a drive ("C:\dir\file") or a UNC path with
* a server and a share ("\\server\share\file"). Each segment after the drive or
* share follows validateWindowsFileName's rules, except that "." and ".." are allowed.
* Device ("\\.\") and extended-length ("\\?\") paths are not supported. A segment
* is at most 255 characters and the path at most 32,767 (not counting "*" in wildcard mode).
*
* @param {string} str - The path string to validate.
* @param {boolean} [useWildCards=false] - Whether to allow wildcard characters in the path.
* @returns {boolean} True if the path is valid, false otherwise.
*/
export function validateWindowsPath(str: string, useWildCards: boolean | null = false): boolean {
  const wild = !!useWildCards;
  if (typeof str !== "string" || fixedLength(str, wild) > MAX_PATH_LENGTH || hasControlCharacters(str) ||
      !(wild ? WINDOWS_PATH_WILDCARD : WINDOWS_PATH).test(str)) {
    return false;
  }

  const unc = str.startsWith("\\\\");
  const names = str.slice(unc ? 2 : 3).split("\\");
  if (unc) {
    // The server is a host name, so only its length is checked here, and it cannot
    // be "." or "..", which would make this a device path ("\\.\COM1"). The share is a real name.
    const server = names.shift() as string;
    if (names.length === 0 || isDotSpecifier(server) || fixedLength(server, wild) > MAX_NAME_LENGTH ||
        isDotSpecifier(names[0])) {
      return false;
    }
  }

  return names.every(name => isDotSpecifier(name) || isValidName(name, wild));
}
