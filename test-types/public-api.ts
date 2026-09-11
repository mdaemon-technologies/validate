// The package's public API, shared by the runtime check (src/api.test.ts) and
// the declaration check (src/types.test.ts).

export const NAMED_EXPORTS = [
  "createSchemaValidator",
  "getSchema",
  "hasControlCharacters",
  "hasLowerCase",
  "hasNumber",
  "hasSpecial",
  "hasUpperCase",
  "isValidPassword",
  "resetPasswordRequirements",
  "setPasswordRequirements",
  "updateSchema",
  "validateDomain",
  "validateEmailAddress",
  "validateHeader",
  "validateHeaderName",
  "validateHeaderValue",
  "validateIPAddress",
  "validateIPv4",
  "validateIPv6",
  "validateInt",
  "validateLdapDN",
  "validatePassword",
  "validatePhoneNumber",
  "validateWindowsFileName",
  "validateWindowsPath"
];

// The type names published in 3.4.0; removing or renaming one breaks TypeScript consumers.
export const TYPE_EXPORTS = [
  "ISchema",
  "ISchemaValidationResult",
  "MDaemonPasswordRequirements",
  "MDaemonValidate",
  "MDaemonValidPassword"
];

// Default-object alias -> the named export it must be identical to.
export const DEFAULT_ALIASES: Record<string, string> = {
  createSchemaValidator: "createSchemaValidator",
  domain: "validateDomain",
  email: "validateEmailAddress",
  getSchema: "getSchema",
  hasControlCharacters: "hasControlCharacters",
  hasLowerCase: "hasLowerCase",
  hasNumber: "hasNumber",
  hasSpecial: "hasSpecial",
  hasUpperCase: "hasUpperCase",
  header: "validateHeader",
  headerName: "validateHeaderName",
  headerValue: "validateHeaderValue",
  ip: "validateIPAddress",
  ipv4: "validateIPv4",
  ipv6: "validateIPv6",
  isInt: "validateInt",
  isValidPassword: "isValidPassword",
  ldapDN: "validateLdapDN",
  password: "validatePassword",
  phoneNumber: "validatePhoneNumber",
  resetPasswordRequirements: "resetPasswordRequirements",
  setPasswordRequirements: "setPasswordRequirements",
  updateSchema: "updateSchema",
  windowsFileName: "validateWindowsFileName",
  windowsPath: "validateWindowsPath"
};
