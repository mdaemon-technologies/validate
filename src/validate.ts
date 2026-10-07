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

// Public entry point. The validators live in their own modules; this file only
// assembles the public API: the named exports, and the default `validate` object
// that maps short aliases to them. src/api.test.ts pins both.

import { hasControlCharacters, hasLowerCase, hasNumber, hasSpecial, hasUpperCase, validateInt } from "./characters";
import { validateHeader, validateHeaderName, validateHeaderValue } from "./headers";
import { validateLdapDN } from "./ldap";
import { validateDomain, validateEmailAddress, validateIPAddress, validateIPv4, validateIPv6 } from "./network";
import { isValidPassword, resetPasswordRequirements, setPasswordRequirements, validatePassword } from "./password";
import { validatePhoneNumber } from "./phone";
import { createSchemaValidator, getSchema, updateSchema } from "./schema";
import { validateWindowsFileName, validateWindowsPath } from "./windows";
import type { MDaemonPasswordRequirements, MDaemonValidPassword } from "./password";
import type { ISchema, ISchemaValidationResult } from "./schema";

export type { MDaemonPasswordRequirements, MDaemonValidPassword } from "./password";
export type { ISchema, ISchemaValidationResult } from "./schema";

export {
  createSchemaValidator,
  getSchema,
  hasControlCharacters,
  hasLowerCase,
  hasNumber,
  hasSpecial,
  hasUpperCase,
  isValidPassword,
  resetPasswordRequirements,
  setPasswordRequirements,
  updateSchema,
  validateDomain,
  validateEmailAddress,
  validateHeader,
  validateHeaderName,
  validateHeaderValue,
  validateIPAddress,
  validateIPv4,
  validateIPv6,
  validateInt,
  validateLdapDN,
  validatePassword,
  validatePhoneNumber,
  validateWindowsFileName,
  validateWindowsPath
};

// MDaemonValidate is kept exactly as published in 3.4.0, apart from 4.0.0's
// controlCharacters field on the MDaemonValidPassword that `password` returns.
// Code may implement it (in a mock, for example), so its members must not change
// outside a major release: adding a required member breaks such code, and so does
// loosening one, because under strictNullChecks a required parameter is not
// assignable to an optional one.

/**
* The API of the default `validate` object. The default export also accepts
* optional arguments (for example `validate.domain("example.com")`) and has
* `hasControlCharacters`.
*/
export interface MDaemonValidate {
  domain: (domain: string, useWildCards: boolean | null) => boolean;
  email: (email: string, useWildCards: boolean | null) => boolean;

  hasLowerCase: (name: string) => boolean;
  hasNumber: (str: string) => boolean;
  hasSpecial: (str: string) => boolean;
  hasUpperCase: (str: string) => boolean;
  isValidPassword: (str: string, bRequireSpecial: boolean, nMinLength: number, nMaxLength: number) => boolean;
  password: (str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number) => MDaemonValidPassword;

  header: (header: string) => boolean;
  headerName: (name: string) => boolean;
  headerValue: (value: string) => boolean;

  ip: (ip: string, useWildCards: boolean | null) => boolean;
  ipv4: (ip: string) => boolean;
  ipv6: (ip: string) => boolean;

  isInt: (value: string) => boolean;

  ldapDN: (str: string) => boolean;

  phoneNumber: (str: string) => boolean;

  windowsFileName: (str: string) => boolean;
  windowsPath: (str: string, useWildCards: boolean | null) => boolean;

  getSchema: (name: string) => ISchema | undefined;
  updateSchema: (name: string, schema: ISchema) => void;
  createSchemaValidator: (name: string, schema: ISchema) => (input: any) => ISchemaValidationResult;
  setPasswordRequirements: (obj: Partial<MDaemonPasswordRequirements>) => boolean;
  resetPasswordRequirements: () => void;
}

const validateObject = {
  domain: validateDomain,
  email: validateEmailAddress,
  createSchemaValidator,
  getSchema,
  updateSchema,
  hasControlCharacters,
  hasLowerCase,
  hasNumber,
  hasSpecial,
  hasUpperCase,
  header: validateHeader,
  headerName: validateHeaderName,
  headerValue: validateHeaderValue,
  isInt: validateInt,
  ldapDN: validateLdapDN,
  ip: validateIPAddress,
  ipv4: validateIPv4,
  ipv6: validateIPv6,
  password: validatePassword,
  isValidPassword,
  phoneNumber: validatePhoneNumber,
  resetPasswordRequirements,
  setPasswordRequirements,
  windowsFileName: validateWindowsFileName,
  windowsPath: validateWindowsPath
};

// The object's own type (optional arguments, hasControlCharacters) comes first and
// MDaemonValidate last. Where the two intersect, TypeScript infers from the last
// signature (as jest.spyOn and Parameters<> do), so typed mocks written for 3.4.0
// keep compiling, while calls still get the optional arguments. The annotation
// also checks that the object satisfies MDaemonValidate.

/**
* The default export: every validator under a short alias (`domain`, `email`,
* `ip`, `password`, ...). It is an MDaemonValidate.
*/
const validate: typeof validateObject & MDaemonValidate = validateObject;

export default validate;
