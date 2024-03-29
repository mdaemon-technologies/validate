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
 * Checks if a string contains newline characters.
 * 
 * @param {string} str - The string to check.
 * @returns {boolean} True if str contains newline characters.
 */
function hasBreaks(str) {
    return typeof str === "string" && /\u000d|\u000a/g.test(str);
}

/**
 * Checks if a string contains control characters like backspace, form feed, 
 * tab, vertical tab, or newline.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} True if str contains control characters.
 */
export function hasControlCharacters(str) {
    return (typeof str === "string" && /\u0008|\u000c|\u0009|\u000b/g.test(str)) || hasBreaks(str);
}

/**
 * Validates that a header name is a valid string without control characters 
 * and only contains alphanumeric characters or hyphens, with no leading/trailing hyphens.
 * 
 * @param {string} name - The header name to validate
 * @returns {boolean} True if the header name is valid
*/
export function validateHeaderName(name) {
    return typeof name === "string" && name.length && !hasControlCharacters(name) && /^[A-Za-z\-]+$/g.test(name) && !/(^-)|(-$)/.test(name);
}

/**
 * Validates that a header value string does not contain control characters.
 * 
 * @param {string} value - The header value to validate
 * @returns {boolean} True if the header value is valid without control characters
*/
export function validateHeaderValue(value) {
    return typeof value === "string" && value.length && !hasControlCharacters(value);
}

/**
 * Validates that a header string contains a valid name and value.
 * 
 * @param {string} header - The header string to validate
 * @returns {boolean} True if the header contains a valid name and value
*/
export function validateHeader(header) {
    if (typeof header !== "string" || header.indexOf(":") === -1) {
        return false;
    }

    const name = header.substring(0, header.indexOf(":")).trim();
    const value = header.substring(header.indexOf(":") + 1).trim();
    return validateHeaderName(name) && validateHeaderValue(value);
}

/**
 * Validates if an email address is valid. 
 * Supports wildcard matching if useWildCards is true.
 * 
 * @param {string} email - The email address to validate
 * @param {boolean} useWildCards - Whether to allow wildcard matching
 * @returns {boolean} True if the email is valid
 */
export function validateEmailAddress(email, useWildCards) {
    if (typeof email !== "string") {
        return false;
    }

    if (useWildCards && (email.indexOf("*") !== -1 || email.indexOf("?") !== -1)) {
        return /[\S]+@[\S]+/.test(sAddr);
    }

    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\"[^\"\\]+\"))@((\[(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.trim());
}

/**
 * Validates if a domain string is valid. 
 * Supports wildcard matching if useWildCards is true.
 * 
 * @param {string} domain - The domain to validate
 * @param {boolean} useWildCards - Whether to allow wildcard matching
 * @returns {boolean} True if the domain is valid
 */
export function validateDomain(domain, useWildCards) {
    if (typeof domain !== "string") {
        return false;
    }

    if (hasControlCharacters(domain)) {
        return false;
    }

    if (/[()<>\[\]:;@\ ]/gm.test(domain)) {
        return false;
    }

    if (useWildCards) {
        return /^[0-9a-zA-Z.?\-*#]+\.[0-9a-zA-Z.?\-*#]+$/g.test(domain);
    }

    return /^[0-9a-zA-Z.\-]+\.[0-9a-zA-Z.\-]+$/g.test(domain);
}

/**
 * Validates if an IP address string is valid.
 * Supports IPv4, IPv6, and wildcard matching if useWildCards is true.
 * 
 * @param {string} ip - The IP address to validate
 * @param {boolean} useWildCards - Whether to allow wildcard matching
 * @returns {boolean} True if the IP address is valid
 */
export function validateIPAddress(ip, useWildCards) {
    if (typeof ip !== "string") {
        return false;
    }
    const ipv6 = ip.indexOf('.') === -1 && ip.indexOf(':') !== -1;
    if (useWildCards) {
        let nIndex = ip.indexOf('*');
        if (nIndex === -1) {
            nIndex = ip.indexOf('#');
        }
        if (nIndex === -1) {
            nIndex = ip.indexOf('?');
        }

        if (ipv6) {
            if (nIndex !== -1) {
                nIndex = ip.indexOf(':');
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf(':', nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf(':', nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }
                return true;
            }
        } else {
            if (nIndex !== -1) {
                nIndex = ip.indexOf('.');
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf('.', nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf('.', nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }
                return true;
            }

            nIndex = ip.indexOf('/');
            if (nIndex !== -1 && ip.indexOf('.') === -1) {
                nIndex = ip.indexOf(':');
                if (nIndex === -1) {
                    return false;
                }
                nIndex = ip.indexOf(':', nIndex);
                if (nIndex === -1) {
                    return false;
                }
                return true;
            }
        }
    }

    let re = /\d/;
    if (!re.test(ip)) {
        return false;
    }

    if (ipv6 && /\/\d{1,3}$/.test(ip)) {
        ip = ip.substr(0, ip.lastIndexOf("/"));
    }

    re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$|^(((2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)\.){3}(2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)(\/(3[012]|[12]?[0-9])))$/;
    return re.test(ip);
}

/**
 * Validates if a given string value is an integer.
 * 
 * @param {string} value - The string value to validate.
 * @returns {boolean} True if the string is a valid integer, false otherwise.
*/
export function validateInt(value) {
    if (typeof value !== "string" || value.length < 1) {
        return false;
    }

    return /^\d*$/.test(value);
}

/**
 * Validates if a given string is a valid Windows file name.
 *
 * @param {string} str - The string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validateWindowsFileName(str) {
    if (typeof str !== "string") {
        return false;
    }

    const re = /["*:<>?\/\\|]+/;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && !re.test(str);
}

/**
 * Validates if a given string is a valid Windows file path.
 * 
 * @param {string} str - The path string to validate.
 * @param {boolean} [useWildCards=false] - Whether to allow wildcard characters in the path.
 * @returns {boolean} True if the path is valid, false otherwise.
 */
export function validateWindowsPath(str, useWildCards) {
    if (typeof str !== "string") {
        return false;
    }
    const re = useWildCards ? /^([A-Za-z]{1}:\\|\\\\)([^":<>\/\\|]+\\?)+([^":<>\/\\|]+)$/ : /^([A-Za-z]{1}:\\|\\\\)([^"*:<>?\/\\|]+\\?)+([^"*:<>?\/\\|]+)$/;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && re.test(str);
}

/**
 * Validates if a given string is a valid LDAP distinguished name (DN).
 * 
 * @param {string} str - The string to validate.
 * @returns {boolean} True if the string is a valid LDAP DN, false otherwise.
 */
export function validateLdapDN(str) {
    if (typeof str !== "string") {
        return false;
    }
    const re = /^(((CN|2\.5\.4\.3|UID|0\.9\.2342\.19200300\.100\.1\.1) *= *([^,]*)))?( *,? *(((?:CN|2\.5\.4\.3|OU|2\.5\.4\.11) *= *[^,]+,?)+))?( *,? *((DC|0\.9\.2342\.19200300\.100\.1\.25) *= *[^,]+)+)*$/i;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && re.test(str);
}

/**
 * Validates if a given string is a valid phone number.
 *
 * @param {string} str - The string to validate.
 * @returns {boolean} True if the string is a valid phone number, false otherwise.
 */
export function validatePhoneNumber(str) {
    return typeof str === "string" && /^\+?[0-9)( -]{5,20}$/.test(str);
}

/**
 * Checks if a string contains any uppercase characters.
 * 
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string contains uppercase characters, false otherwise.
 */
export function hasUpperCase(str) {
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
export function hasLowerCase(str) {
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
export function hasNumber(str) {
    if (typeof str !== "string") {
        return false;
    }
    return /[0-9]+/.test(str);
}

/**
 * Checks if the given string contains any special characters.
 * Returns false if the input is not a string.
*/
export function hasSpecial(str) {
    if (typeof str !== "string") {
        return false;
    }
    return /[!-/]+|[:-@]+|[[-`]+|[{-~]/.test(str);
}

const passwordRequirements = {
    requireUpper: false,
    requireLower: false,
    requireNumber: false,
    requireSpecial: false,
    requireMinLength: -1,
    requireMaxLength: -1,
    setByUser: false
};

/**
 * Sets the password requirements to use for validation.
 * 
 * @param {Object} obj - Object containing password requirement settings.
 * @param {boolean} [obj.upper] - Whether an uppercase letter is required.
 * @param {boolean} [obj.lower] - Whether a lowercase letter is required. 
 * @param {boolean} [obj.number] - Whether a number is required.
 * @param {number} [obj.min] - Minimum password length.
 * @param {number} [obj.max] - Maximum password length.
 * @returns {boolean} True if requirements were set successfully, false otherwise.
 */
export function setPasswordRequirements(obj) {
    if (typeof obj.upper !== "undefined") {
        passwordRequirements.requireUpper = !!obj.upper;
    }
    if (typeof obj.lower !== "undefined") {
        passwordRequirements.lower = !!obj.lower;
    }
    if (typeof obj.special !== "undefined") {
        passwordRequirements.requireSpecial = !!obj.special;
    }
    if (typeof obj.number !== "undefined") {
        passwordRequirements.requireNumber = !!obj.number;
    }
    if (typeof obj.min === "number" && obj.min > 0) {
        passwordRequirements.requireMinLength = obj.min;
    }
    if (typeof obj.max === "number" && obj.max > 0) {
        passwordRequirements.requireMaxLength = obj.max;
    }

    if (passwordRequirements.max > 0 && passwordRequirements.min > 0 && passwordRequirements.max <= passwordRequirements.min) {
        console.error("The minimum password length requirement must be less than the maximum password length requirement");
        return false;
    }

    passwordRequirements.setByUser = true;
    return true;
}

/**
 * Resets the password requirements object to its default state.
 */
export function resetPasswordRequirements() {
    passwordRequirements.requireUpper = false;
    passwordRequirements.requireLower = false;
    passwordRequirements.requireNumber = false;
    passwordRequirements.requireSpecial = false;
    passwordRequirements.requireMinLength = -1;
    passwordRequirements.requireMaxLength = -1;
    passwordRequirements.setByUser = false;
}

/**
 * Validates a password string against a set of requirements.
 * 
 * @param {string} str - The password string to validate.
 * @param {boolean} [bRequireSpecial] - Whether to require special characters. Overrides global setting if passed.
 * @param {number} [nMinLength] - Minimum length requirement. Overrides global setting if passed. 
 * @param {number} [nMaxLength] - Maximum length requirement. Overrides global setting if passed.
 * @returns {Object} Validation results:
 * - special: Whether password contains special characters. 
 * - lower: Whether password contains lowercase letters.
 * - upper: Whether password contains uppercase letters.
 * - number: Whether password contains numbers.
 * - length: Length of password.
 * - min: Whether password meets minimum length requirement.
 * - max: Whether password meets maximum length requirement.
 */
export function validatePassword(str, bRequireSpecial, nMinLength, nMaxLength) {
    let ret = {};
    if (typeof str !== "string") {
        ret = { special: false, lower: false, upper: false, number: false, length: 0 };
        if (typeof nMinLength === "number" || (passwordRequirements.setByUser && passwordRequirements.requireMinLength > 0)) {
            ret.min = false;
        }

        if (typeof nMaxLength === "number" || (passwordRequirements.setByUser && passwordRequirements.requireMaxLength > 0)) {
            ret.max = false;
        }
        return ret;
    }

    if (passwordRequirements.setByUser) {
        let req = Object.assign(passwordRequirements);
        if ((req.requireSpecial && typeof bRequireSpecial === "undefined") || bRequireSpecial) {
            ret.special = hasSpecial(str);
        }

        if (req.requireMinLength > 0 && typeof nMinLength !== "number") {
            ret.min = str.length >= req.requireMinLength;
        }
        else if (typeof nMinLength === "number" && nMinLength > 0) {
            ret.min = str.length >= nMinLength;
        }

        if (req.requireMaxLength > 0 && typeof nMaxLength !== "number") {
            ret.max = str.length <= req.requireMaxLength;
        }
        else if (typeof nMaxLength === "number" && nMaxLength > 0) {
            ret.max = str.length <= nMaxLength;
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

        return ret;
    }

    ret = {
        special: bRequireSpecial ? hasSpecial(str) : true,
        lower: hasLowerCase(str),
        upper: hasUpperCase(str),
        number: hasNumber(str),
        length: str.length
    };

    if (typeof nMinLength === "number") {
        ret.min = str.length >= nMinLength;
    }

    if (typeof nMaxLength === "number") {
        ret.max = str.length <= nMaxLength;
    }

    return ret;
}

/**
 * Validates if a given password meets a set of password 
 * requirements.
 * 
 * @param {string} str - The password to validate.
 * @param {boolean} bRequireSpecial - Whether to require special characters. 
 * @param {number} nMinLength - The minimum password length.
 * @param {number} nMaxLength - The maximum password length.  
 * 
 * @returns {boolean} True if the password is valid, false otherwise.
 */
export function isValidPassword(str, bRequireSpecial, nMinLength, nMaxLength) {
    if (typeof str !== "string") {
        return false;
    }

    let ret = validatePassword(str, bRequireSpecial, nMinLength, nMaxLength);
    if (typeof ret.lower !== "undefined" && !ret.lower) {
        return false;
    }

    if (typeof ret.upper !== "undefined" && !ret.upper) {
        return false;
    }

    if (typeof ret.number !== "undefined" && !ret.number) {
        return false;
    }

    if (typeof ret.special !== "undefined" && !ret.special) {
        return false;
    }

    if (typeof ret.min !== "undefined" && !ret.min) {
        return false;
    }

    if (typeof ret.max !== "undefined" && !ret.max) {
        return false;
    }

    return true;
}


const validate = {
    domain: validateDomain,
    email: validateEmailAddress,
    hasControlCharacters: hasControlCharacters,
    hasLowerCase: hasLowerCase,
    hasNumber: hasNumber,
    hasSpecial: hasSpecial,
    hasUpperCase: hasUpperCase,
    header: validateHeader,
    headerName: validateHeaderName,
    headerValue: validateHeaderValue,
    isInt: validateInt,
    ldapDN: validateLdapDN,
    ip: validateIPAddress,
    password: validatePassword,
    isValidPassword,
    phoneNumber: validatePhoneNumber,
    resetPasswordRequirements,
    setPasswordRequirements,
    windowsFileName: validateWindowsFileName,
    windowsPath: validateWindowsPath
};

export default validate;