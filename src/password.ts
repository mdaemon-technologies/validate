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

import { hasControlCharacters, hasLowerCase, hasNumber, hasSpecial, hasUpperCase } from "./characters";

/**
* The password requirements in effect.
*
* @property {boolean} requireUpper - Whether an uppercase character is required.
* @property {boolean} requireLower - Whether a lowercase character is required.
* @property {boolean} requireNumber - Whether a number is required.
* @property {boolean} requireSpecial - Whether a special character is required.
* @property {number} requireMinLength - The minimum password length required (-1 when unset).
* @property {number} requireMaxLength - The maximum password length allowed (-1 when unset).
* @property {string[]} badPasswords - Passwords rejected case-insensitively.
* @property {boolean} setByUser - Whether the requirements were set by the user.
*/
interface IPasswordRequirements {
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  requireMinLength: number;
  requireMaxLength: number;
  badPasswords: string[];
  setByUser: boolean;
}

/** Options accepted by setPasswordRequirements (the shape published since 3.x). */
export interface MDaemonPasswordRequirements {
  upper?: boolean;
  lower?: boolean;
  number?: boolean;
  special?: boolean;
  min?: number;
  max?: number;
  badPasswords?: string[];
}

/**
 * Result of validatePassword.
 *
 * Once password requirements have been set, only the checks being enforced are
 * present, so `upper`, `lower`, `number` and `special` may be absent at runtime
 * even though they are typed as required (the published type is kept for
 * compatibility). Compare them with `=== false`, as isValidPassword does.
 * `length` and `controlCharacters` are always present.
 */
export interface MDaemonValidPassword {
  /** Whether the password has an upper case letter. May be absent once requirements are set: compare with `=== false`. */
  upper: boolean;
  /** Whether the password has a lower case letter. May be absent once requirements are set: compare with `=== false`. */
  lower: boolean;
  /** Whether the password has a digit. May be absent once requirements are set: compare with `=== false`. */
  number: boolean;
  /**
   * Whether the password has a special character. Before requirements are set it
   * is `true` unless special characters were requested. May be absent once
   * requirements are set: compare with `=== false`.
   */
  special: boolean;
  /** The password's length. */
  length: number;
  /** Whether the password contains a control character (U+0000-U+001F or U+007F), which makes it invalid. Always present. */
  controlCharacters: boolean;
  /** Whether the password meets the minimum length. Present only when a minimum applies. */
  min?: boolean;
  /** Whether the password is within the maximum length. Present only when a maximum applies. */
  max?: boolean;
  /** Whether the password is in the bad-password list. Present only when that list is in use. */
  badPassword?: boolean;
}

type CharacterCheck = "upper" | "lower" | "number" | "special";

// What validatePassword actually builds: the character checks are optional (see
// MDaemonValidPassword); every other field keeps its published type.
type PasswordResult = Omit<MDaemonValidPassword, CharacterCheck> & Partial<Pick<MDaemonValidPassword, CharacterCheck>>;

function hasBadPassword(str: string, badPasswords: string[]): boolean {
    const lowerStr = str.toLowerCase();
    return badPasswords.some(bad => bad.toLowerCase() === lowerStr);
}

// The state before setPasswordRequirements is called: setByUser is false, so
// validatePassword applies its built-in checks.
const DEFAULT_PASSWORD_REQUIREMENTS: Readonly<IPasswordRequirements> = {
  requireUpper: false,
  requireLower: false,
  requireNumber: false,
  requireSpecial: false,
  requireMinLength: -1,
  requireMaxLength: -1,
  setByUser: false,
  badPasswords: []
};

const passwordRequirements: IPasswordRequirements = { ...DEFAULT_PASSWORD_REQUIREMENTS, badPasswords: [] };

/**
* Sets the password requirements to use for validation.
*
* @param {Object} obj - Object containing password requirement settings.
* @param {boolean} [obj.upper] - Whether an uppercase letter is required.
* @param {boolean} [obj.lower] - Whether a lowercase letter is required.
* @param {boolean} [obj.number] - Whether a number is required.
* @param {number} [obj.min] - Minimum password length.
* @param {number} [obj.max] - Maximum password length.
* @param {boolean} [obj.special] - Whether a special character is required.
* @param {string[]} [obj.badPasswords] - Passwords to reject (case-insensitive); an empty array clears the list.
* @returns {boolean} True if requirements were set successfully, false otherwise.
*
* Once called, only the requirements that have been enabled are enforced: the
* default of requiring an upper case letter, a lower case letter and a number
* no longer applies until resetPasswordRequirements() is called.
*/
export function setPasswordRequirements(obj: Partial<MDaemonPasswordRequirements>): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return false;
  }

  // Resolve everything into locals first so that a validation failure leaves
  // the existing requirements untouched instead of committing a partial,
  // inconsistent state.
  const next: IPasswordRequirements = Object.assign({}, passwordRequirements);

  if (typeof obj.upper !== "undefined") {
      next.requireUpper = !!obj.upper;
  }
  if (typeof obj.lower !== "undefined") {
      next.requireLower = !!obj.lower;
  }
  if (typeof obj.special !== "undefined") {
      next.requireSpecial = !!obj.special;
  }
  if (typeof obj.number !== "undefined") {
      next.requireNumber = !!obj.number;
  }
  if (typeof obj.min === "number" && obj.min > 0) {
      next.requireMinLength = obj.min;
  }
  if (typeof obj.max === "number" && obj.max > 0) {
      next.requireMaxLength = obj.max;
  }

  if (next.requireMaxLength > 0 && next.requireMinLength > 0 &&
      next.requireMaxLength <= next.requireMinLength) {
      return false;
  }

  // An explicit list replaces the current one; an empty list clears it.
  if (Array.isArray(obj.badPasswords)) {
      next.badPasswords = obj.badPasswords.filter(p => typeof p === "string");
  }

  next.setByUser = true;
  Object.assign(passwordRequirements, next);
  return true;
}

/**
* Resets the password requirements object to its default state.
*/
export function resetPasswordRequirements(): void {
  Object.assign(passwordRequirements, DEFAULT_PASSWORD_REQUIREMENTS, { badPasswords: [] });
}

/**
* Resolves the effective min or max length: an explicit argument wins (values
* below 1 disable the check), otherwise the configured requirement applies
* (it stays -1 until set by setPasswordRequirements).
*/
function resolveLengthLimit(override: number | undefined, configured: number): number | undefined {
  if (typeof override === "number") {
      return override > 0 ? override : undefined;
  }
  return configured > 0 ? configured : undefined;
}

/**
* Validates a password string against a set of requirements.
* `controlCharacters` is always reported, whatever the requirements.
*
* @param {string} str - The password string to validate.
* @param {boolean} [bRequireSpecial] - Whether to require special characters. Overrides global setting if passed.
* @param {number} [nMinLength] - Minimum length requirement. Overrides global setting if passed.
* @param {number} [nMaxLength] - Maximum length requirement. Overrides global setting if passed.
* @returns {MDaemonValidPassword} The results of the checks (see MDaemonValidPassword).
* Once setPasswordRequirements has been called, only the enforced checks are included.
*/
export function validatePassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): MDaemonValidPassword {
  const req = passwordRequirements;
  let ret: PasswordResult;

  if (typeof str !== "string") {
      ret = { special: false, lower: false, upper: false, number: false, length: 0, controlCharacters: false };
  }
  else if (req.setByUser) {
      ret = { length: str.length, controlCharacters: hasControlCharacters(str) };
      if ((req.requireSpecial && typeof bRequireSpecial === "undefined") || bRequireSpecial) {
          ret.special = hasSpecial(str);
      }

      if (req.requireLower) {
          ret.lower = hasLowerCase(str);
      }

      if (req.requireUpper) {
          ret.upper = hasUpperCase(str);
      }

      if (req.requireNumber) {
          ret.number = hasNumber(str);
      }

      if (req.badPasswords.length > 0) {
          ret.badPassword = hasBadPassword(str, req.badPasswords);
      }
  }
  else {
      ret = {
          special: bRequireSpecial ? hasSpecial(str) : true,
          lower: hasLowerCase(str),
          upper: hasUpperCase(str),
          number: hasNumber(str),
          length: str.length,
          controlCharacters: hasControlCharacters(str)
      };
  }

  // A non-string can never satisfy a length requirement.
  const minLength = resolveLengthLimit(nMinLength, req.requireMinLength);
  if (minLength !== undefined) {
      ret.min = typeof str === "string" && str.length >= minLength;
  }

  const maxLength = resolveLengthLimit(nMaxLength, req.requireMaxLength);
  if (maxLength !== undefined) {
      ret.max = typeof str === "string" && str.length <= maxLength;
  }

  return ret as MDaemonValidPassword;
}

/**
* Validates if a given password meets a set of password
* requirements. A password containing a control character is never valid.
*
* @param {string} str - The password to validate.
* @param {boolean} bRequireSpecial - Whether to require special characters.
* @param {number} nMinLength - The minimum password length.
* @param {number} nMaxLength - The maximum password length.
*
* @returns {boolean} True if the password is valid, false otherwise.
*/
export function isValidPassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): boolean {
  if (typeof str !== "string") {
      return false;
  }

  // Absent fields were not checked; only an explicit false fails.
  const result: PasswordResult = validatePassword(str, bRequireSpecial, nMinLength, nMaxLength);
  const checks = ["lower", "upper", "number", "special", "min", "max"] as const;
  return checks.every(check => result[check] !== false) &&
      result.badPassword !== true && !result.controlCharacters;
}
