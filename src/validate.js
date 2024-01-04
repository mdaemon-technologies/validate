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

function hasBreaks(str) {
    return typeof str === "string" && /\u000d|\u000a/g.test(str);
}

export function hasControlCharacters(str) {
    return (typeof str === "string" && /\u0008|\u000c|\u0009|\u000b/g.test(str)) || hasBreaks(str);
}

export function validateHeaderName(name) {
    return typeof name === "string" && name.length && !hasControlCharacters(name) && /^[A-Za-z\-]+$/g.test(name) && !/(^-)|(-$)/.test(name);
}

export function validateHeaderValue(value) {
    return typeof value === "string" && value.length && !hasControlCharacters(value);
}

export function validateHeader(header) {
    if (typeof header !== "string" || header.indexOf(":") === -1) {
        return false;
    }

    const name = header.substring(0, header.indexOf(":")).trim();
    const value = header.substring(header.indexOf(":") + 1).trim();
    return validateHeaderName(name) && validateHeaderValue(value);
}

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

export function validateInt(value) {
    if (typeof value !== "string" || value.length < 1) {
        return false;
    }

    return /^\d*$/.test(value);
}

export function validateWindowsFileName(str) {
    if (typeof str !== "string") {
      return false;
    }

    const re = /["*:<>?\/\\|]+/;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && !re.test(str);
}

export function validateWindowsPath(str, useWildCards) {
    if (typeof str !== "string") {
      return false;
    }
    const re = useWildCards ? /^([A-Za-z]{1}:\\|\\\\)([^":<>\/\\|]+\\?)+([^":<>\/\\|]+)$/ : /^([A-Za-z]{1}:\\|\\\\)([^"*:<>?\/\\|]+\\?)+([^"*:<>?\/\\|]+)$/;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && re.test(str);
}

export function validateLdapDN(str) {
    if (typeof str !== "string") {
      return false;
    }
    const re = /^(((CN|2\.5\.4\.3|UID|0\.9\.2342\.19200300\.100\.1\.1) *= *([^,]*)))?( *,? *(((?:CN|2\.5\.4\.3|OU|2\.5\.4\.11) *= *[^,]+,?)+))?( *,? *((DC|0\.9\.2342\.19200300\.100\.1\.25) *= *[^,]+)+)*$/i;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && re.test(str);
}

export function validatePhoneNumber(str) {
  return typeof str === "string" && /^\+?[0-9)( -]{5,20}$/.test(str);
}

export function hasUpperCase(str) {
    if (typeof str !== "string") {
      return false;
    }
    return /[A-Z]+/.test(str);
}

export function hasLowerCase(str) {
    if (typeof str !== "string") {
      return false;
    }
    return /[a-z]+/.test(str);
}

export function hasNumber(str) {
    if (typeof str !== "string") {
      return false;
    }
    return /[0-9]+/.test(str);
}

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

export function resetPasswordRequirements() {
    passwordRequirements.requireUpper = false;
    passwordRequirements.requireLower = false;
    passwordRequirements.requireNumber = false;
    passwordRequirements.requireSpecial = false;
    passwordRequirements.requireMinLength = -1;
    passwordRequirements.requireMaxLength = -1;
    passwordRequirements.setByUser = false;
}

export function validatePassword(str, bRequireSpecial, nMinLength, nMaxLength) {
    let ret = { };
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