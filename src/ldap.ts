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

// An optional CN/UID component, then CN/OU components, then DC components. This
// accepts exactly what the original, exponential pattern did, but backtracks at most
// quadratically: repeated values are matched atomically with (?=(...))\k<...>, so a
// value always runs to the next comma, which is where any successful parse ends it
// anyway. Separators are written " *(?:, *)?" instead of the ambiguous " *,? *".
const LDAP_DN = /^(?:(?:CN|2\.5\.4\.3|UID|0\.9\.2342\.19200300\.100\.1\.1) *=[^,]*)?(?: *(?:, *)?(?:(?:CN|2\.5\.4\.3|OU|2\.5\.4\.11)(?=(?<ou> *= *[^,]+))\k<ou>,?)+)?(?: *(?:, *)?(?:DC|0\.9\.2342\.19200300\.100\.1\.25)(?=(?<dc> *= *[^,]+))\k<dc>)*$/i;

/**
* Validates if a given string is a valid LDAP distinguished name (DN).
* Rejects any control character, not only CR and LF.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid LDAP DN, false otherwise.
*/
export function validateLdapDN(str: string): boolean {
  if (typeof str !== "string") {
      return false;
  }
  return !!str.trim() && !hasControlCharacters(str) && LDAP_DN.test(str);
}
