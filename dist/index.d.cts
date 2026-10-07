/**
* Checks if a string contains any C0 control character (U+0000-U+001F) or DEL (U+007F).
*
* @param {string} str - The string to check.
* @returns {boolean} True if str contains control characters.
*/
declare function hasControlCharacters(str: string): boolean;
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
declare function validateInt(value: string): boolean;
/**
* Checks if a string contains any uppercase characters.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains uppercase characters, false otherwise.
*/
declare function hasUpperCase(str: string): boolean;
/**
* Checks if a string contains any lowercase characters.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains lowercase characters, false otherwise.
*/
declare function hasLowerCase(str: string): boolean;
/**
* Checks if a string contains any numbers.
*
* @param {string} str - The string to check.
* @returns {boolean} True if the string contains numbers, false otherwise.
*/
declare function hasNumber(str: string): boolean;
/**
* Checks if the given string contains any special characters.
* Returns false if the input is not a string.
*/
declare function hasSpecial(str: string): boolean;

/**
* Validates that a header name is a valid string without control characters
* and only contains alphanumeric characters or hyphens, with no leading/trailing hyphens.
*
* @param {string} name - The header name to validate
* @returns {boolean} True if the header name is valid
*/
declare function validateHeaderName(name: string): boolean;
/**
* Validates that a header value string does not contain control characters.
*
* @param {string} value - The header value to validate
* @returns {boolean} True if the header value is valid without control characters
*/
declare function validateHeaderValue(value: string): boolean;
/**
* Validates that a header string contains a valid name and value.
* Rejects any control character, including a CR, LF or tab around the name or value.
*
* @param {string} header - The header string to validate
* @returns {boolean} True if the header contains a valid name and value
*/
declare function validateHeader(header: string): boolean;

/**
* Validates if a given string is a valid LDAP distinguished name (DN).
* Rejects any control character, not only CR and LF.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid LDAP DN, false otherwise.
*/
declare function validateLdapDN(str: string): boolean;

/**
* Validates if an email address is valid.
* Supports wildcard matching if useWildCards is true.
* Rejects any control character, including a leading or trailing CR, LF or tab.
*
* @param {string} email - The email address to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the email is valid
*/
declare function validateEmailAddress(email: string, useWildCards?: boolean | null): boolean;
/**
* Validates if a domain string is valid.
* Supports wildcard matching if useWildCards is true.
*
* @param {string} domain - The domain to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the domain is valid
*/
declare function validateDomain(domain: string, useWildCards?: boolean | null): boolean;
/**
* Validates if an IP address string is valid.
* Supports IPv4, IPv6, and wildcard matching if useWildCards is true.
* Rejects any control character, including a leading or trailing CR, LF or tab.
*
* @param {string} ip - The IP address to validate
* @param {boolean} useWildCards - Whether to allow wildcard matching
* @returns {boolean} True if the IP address is valid
*/
declare function validateIPAddress(ip: string, useWildCards?: boolean | null): boolean;
/**
 * Validates if a given IPv4 address is valid.
 *
 * @param ip - The IPv4 address to validate.
 * @returns {boolean} True if the IPv4 address is valid, false otherwise.
 */
declare function validateIPv4(ip: string): boolean;
/**
 * Validates if a given IPv6 address is valid, including IPv4-mapped forms such as "::ffff:1.2.3.4".
 *
 * @param {string} ip - The IPv6 address to validate.
 * @returns {boolean} True if the IPv6 address is valid, false otherwise.
 */
declare function validateIPv6(ip: string): boolean;

/** Options accepted by setPasswordRequirements (the shape published since 3.x). */
interface MDaemonPasswordRequirements {
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
interface MDaemonValidPassword {
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
declare function setPasswordRequirements(obj: Partial<MDaemonPasswordRequirements>): boolean;
/**
* Resets the password requirements object to its default state.
*/
declare function resetPasswordRequirements(): void;
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
declare function validatePassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): MDaemonValidPassword;
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
declare function isValidPassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): boolean;

/**
* Validates if a given string is a valid phone number.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid phone number, false otherwise.
*/
declare function validatePhoneNumber(str: string): boolean;

interface ISchemaValidationResult {
    valid: boolean;
    errors: string[];
}
interface ISchema {
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    minItems?: number;
    maxItems?: number;
    options?: any[];
    validate?: (value: any) => boolean;
    pattern?: string;
    properties?: Record<string, ISchema>;
    arraySchema?: ISchema;
}
/**
* Returns a copy of the schema registered under a name.
*
* @param {string} name - The schema name.
* @returns {ISchema | undefined} A deep copy of the schema, or undefined if none is registered.
*/
declare function getSchema(name: string): ISchema | undefined;
/**
* Registers (or replaces) the schema for a name. The schema is validated and
* copied, so later changes to the object passed in have no effect. Validators
* created for the name look the schema up at call time, so they see the update.
*
* @param {string} name - The schema name.
* @param {ISchema} schema - The schema to register.
* @throws {TypeError} If the name is not a non-empty string, or the schema is
* malformed (a non-object sub-schema, an unknown type, an invalid pattern, or a cycle).
*/
declare function updateSchema(name: string, schema: ISchema): void;
/**
* Registers a schema under a name and returns a validator for that name. The
* validator reports problems as { valid, errors } instead of throwing; nested
* errors are prefixed with "propName: " or "[index]: ".
*
* @param {string} name - The schema name.
* @param {ISchema} schema - The schema to register.
* @returns {(input: any) => ISchemaValidationResult} The validator.
* @throws {TypeError} Under the same conditions as updateSchema.
*/
declare function createSchemaValidator(name: string, schema: ISchema): (input: any) => ISchemaValidationResult;

/**
* Validates if a given string is a valid Windows file name.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if valid, false otherwise.
*/
declare function validateWindowsFileName(str: string): boolean;
/**
* Validates if a given string is a valid Windows file path.
*
* @param {string} str - The path string to validate.
* @param {boolean} [useWildCards=false] - Whether to allow wildcard characters in the path.
* @returns {boolean} True if the path is valid, false otherwise.
*/
declare function validateWindowsPath(str: string, useWildCards?: boolean | null): boolean;

/**
* The API of the default `validate` object. The default export also accepts
* optional arguments (for example `validate.domain("example.com")`) and has
* `hasControlCharacters`.
*/
interface MDaemonValidate {
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
declare const validateObject: {
    domain: typeof validateDomain;
    email: typeof validateEmailAddress;
    createSchemaValidator: typeof createSchemaValidator;
    getSchema: typeof getSchema;
    updateSchema: typeof updateSchema;
    hasControlCharacters: typeof hasControlCharacters;
    hasLowerCase: typeof hasLowerCase;
    hasNumber: typeof hasNumber;
    hasSpecial: typeof hasSpecial;
    hasUpperCase: typeof hasUpperCase;
    header: typeof validateHeader;
    headerName: typeof validateHeaderName;
    headerValue: typeof validateHeaderValue;
    isInt: typeof validateInt;
    ldapDN: typeof validateLdapDN;
    ip: typeof validateIPAddress;
    ipv4: typeof validateIPv4;
    ipv6: typeof validateIPv6;
    password: typeof validatePassword;
    isValidPassword: typeof isValidPassword;
    phoneNumber: typeof validatePhoneNumber;
    resetPasswordRequirements: typeof resetPasswordRequirements;
    setPasswordRequirements: typeof setPasswordRequirements;
    windowsFileName: typeof validateWindowsFileName;
    windowsPath: typeof validateWindowsPath;
};
/**
* The default export: every validator under a short alias (`domain`, `email`,
* `ip`, `password`, ...). It is an MDaemonValidate.
*/
declare const validate: typeof validateObject & MDaemonValidate;

export { createSchemaValidator, validate as default, getSchema, hasControlCharacters, hasLowerCase, hasNumber, hasSpecial, hasUpperCase, isValidPassword, resetPasswordRequirements, setPasswordRequirements, updateSchema, validateDomain, validateEmailAddress, validateHeader, validateHeaderName, validateHeaderValue, validateIPAddress, validateIPv4, validateIPv6, validateInt, validateLdapDN, validatePassword, validatePhoneNumber, validateWindowsFileName, validateWindowsPath };
export type { ISchema, ISchemaValidationResult, MDaemonPasswordRequirements, MDaemonValidPassword, MDaemonValidate };
