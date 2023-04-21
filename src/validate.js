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

export function validatePassword(str, bRequireSpecial) {
    return {
        special: bRequireSpecial ? hasSpecial(str) : true,
        lower: hasLowerCase(str),
        upper: hasUpperCase(str),
        number: hasNumber(str),
        length: str.length
    }
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
    ldapDN: validateLdapDN,
    ip: validateIPAddress,
    isInt: validateInt,
    password: validatePassword,
    windowsFileName: validateWindowsFileName,
    windowsPath: validateWindowsPath
};

export default validate;