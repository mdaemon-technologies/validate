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

/**
* Validates if a given string is a valid Windows file name.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if valid, false otherwise.
*/
export function validateWindowsFileName(str: string): boolean {
  return typeof str === "string" && !!str.trim() && !hasControlCharacters(str) && !/["*:<>?\/\\|]/.test(str);
}

/**
* Validates if a given string is a valid Windows file path.
*
* @param {string} str - The path string to validate.
* @param {boolean} [useWildCards=false] - Whether to allow wildcard characters in the path.
* @returns {boolean} True if the path is valid, false otherwise.
*/
export function validateWindowsPath(str: string, useWildCards: boolean | null = false): boolean {
  // A segment made only of spaces cannot exist on Windows, which strips trailing spaces.
  return typeof str === "string" && !hasControlCharacters(str) && !/\\ +(?:\\|$)/.test(str) &&
      (useWildCards ? WINDOWS_PATH_WILDCARD : WINDOWS_PATH).test(str);
}
