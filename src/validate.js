/*
*    Copyright (C) 1998-2022  MDaemon Technologies, Ltd.
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
    return /\r|\n/g.test(str);
}

function validateHeaderName(name) {
    return typeof name === "string" && name.length && !hasBreaks(name) && /^[A-Za-z\-]+$/g.test(name);
}

function validateHeaderValue(value) {
    return typeof value === "string" && value.length && !hasBreaks(value);
}

function validateHeader(header) {
    if (typeof header !== "string" || header.indexOf(":") === -1) {
        return false;
    }

    var name = header.substring(0, header.indexOf(":")).trim();
    var value = header.substring(header.indexOf(":") + 1).trim();
    return validateHeaderName(name) && validateHeaderValue(value);
}

function validateEmailAddress(email, useWildCards) {
    if (useWildCards && (email.indexOf("*") !== -1 || email.indexOf("?") !== -1)) {
        return /[\S]+@[\S]+/.test(sAddr);
    }

    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\"[^\"\\]+\"))@((\[(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.trim());
}

function validateDomain(domain, useWildCards) {
    if (hasBreaks(domain)) {
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

function validateIPAddress(ip, useWildCards) {
    var ipv6 = ip.indexOf(".") === -1 && ip.indexOf(":") !== -1;
    if (useWildCards) {
        var nIndex = ip.indexOf("*");
        if (nIndex === -1) {
            nIndex = ip.indexOf("#");
        }
        if (nIndex === -1) {
            nIndex = ip.indexOf("?");
        }

        if (ipv6) {
            if (nIndex !== -1) {
                if ((nIndex = ip.indexOf(":")) === -1) {
                    return false;
                }

                nIndex = ip.indexOf(":", nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf(":", nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }
                return true;
            }
        }
        else {
            if (nIndex !== -1) {
                if ((nIndex = ip.indexOf(".")) === -1) {
                    return false;
                }

                nIndex = ip.indexOf(".", nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }

                nIndex = ip.indexOf(".", nIndex + 1);
                if (nIndex === -1) {
                    return false;
                }
                return true;
            }

            if (((nIndex = ip.indexOf("/")) !== -1) && (nIndex = ip.indexOf('.')) === -1) {
                if ((nIndex = ip.indexOf(":")) === -1) {
                    return false;
                }
                if ((nIndex = ip.indexOf(":", nIndex)) === -1) {
                    return false;
                }
                return true;
            }
        }

    }

    var re = /\d/;
    if (!re.test(ip)) {
        return false;
    }

    re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$|^(((2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)\.){3}(2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)(\/(3[012]|[12]?[0-9])))$/;
    return re.test(ip);
}

function validateInt(value) {
    if (value.length < 1) {
        return false;
    }

    var re = /^\d*$/;
    return re.test(value);
}

function validateWindowsFileName(str) {
    var re = /[~"#%&*:<>?\/\\{|}]+/;
    return typeof str === "string" && str.trim() && !re.test(str);
}

function validateWindowsPath(str, useWildCards) {
    var re = useWildCards ? /^(\S{1}:\\|\\\\)([^~"#%&:<>?\/\\{|}]+\\?)+([^~"#%&:<>?\/\\{|}]+)/ : /^(\S{1}:\\|\\\\)([^*~"#%&:<>?\/\\{|}]+\\?)+([^*~"#%&:<>?\/\\{|}]+)/;
    return typeof str === "string" && str.trim() && !hasBreaks(str) && re.test(str);
}

function validateLdapDN(str) {
    var re = /^((CN=([^,]*)),)?((((?:CN|OU)=[^,]+,?)+),)?((DC=[^,]+,?)+)$/i;
    return typeof str === "string" && str.trim() && re.test(str);
}

function hasUpperCase(str) {
    return /[A-Z]+/.test(str);
}

function hasLowerCase(str) {
    return /[a-z]+/.test(str);
}

function hasNumber(str) {
    return /[0-9]+/.test(str);
}

function hasSpecial(str) {
    return /[!-/]+|[:-@]+|[\[-`]+|[{-~]/.test(str);
}

const validate = {
    domain: validateDomain,
    email: validateEmailAddress,
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
    windowsFileName: validateWindowsFileName,
    windowsPath: validateWindowsPath
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = validate;
}

export default validate;