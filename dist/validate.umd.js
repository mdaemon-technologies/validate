!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).validate={})}(this,(function(t){"use strict";function e(t){return"string"==typeof t&&/\u000d|\u000a/g.test(t)}function n(t){return"string"==typeof t&&/\u0008|\u000c|\u0009|\u000b/g.test(t)||e(t)}function d(t){return"string"==typeof t&&t.length&&!n(t)&&/^[A-Za-z\-]+$/g.test(t)&&!/(^-)|(-$)/.test(t)}function i(t){return"string"==typeof t&&t.length&&!n(t)}function r(t){if("string"!=typeof t||-1===t.indexOf(":"))return!1;const e=t.substring(0,t.indexOf(":")).trim(),n=t.substring(t.indexOf(":")+1).trim();return d(e)&&i(n)}function a(t,e){if("string"!=typeof t)return!1;if(e&&(-1!==t.indexOf("*")||-1!==t.indexOf("?")))return/[\S]+@[\S]+/.test(sAddr);return/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\"[^\"\\]+\"))@((\[(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(t.trim())}function f(t,e){return"string"==typeof t&&(!n(t)&&(!/[()<>\[\]:;@\ ]/gm.test(t)&&(e?/^[0-9a-zA-Z.?\-*#]+\.[0-9a-zA-Z.?\-*#]+$/g.test(t):/^[0-9a-zA-Z.\-]+\.[0-9a-zA-Z.\-]+$/g.test(t))))}function s(t,e){if("string"!=typeof t)return!1;const n=-1===t.indexOf(".")&&-1!==t.indexOf(":");if(e){let e=t.indexOf("*");if(-1===e&&(e=t.indexOf("#")),-1===e&&(e=t.indexOf("?")),n){if(-1!==e)return e=t.indexOf(":"),-1!==e&&(e=t.indexOf(":",e+1),-1!==e&&(e=t.indexOf(":",e+1),-1!==e))}else{if(-1!==e)return e=t.indexOf("."),-1!==e&&(e=t.indexOf(".",e+1),-1!==e&&(e=t.indexOf(".",e+1),-1!==e));if(e=t.indexOf("/"),-1!==e&&-1===t.indexOf("."))return e=t.indexOf(":"),-1!==e&&(e=t.indexOf(":",e),-1!==e)}}let d=/\d/;return!!d.test(t)&&(n&&/\/\d{1,3}$/.test(t)&&(t=t.substr(0,t.lastIndexOf("/"))),d=/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$|^(((2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)\.){3}(2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)(\/(3[012]|[12]?[0-9])))$/,d.test(t))}function o(t){return!("string"!=typeof t||t.length<1)&&/^\d*$/.test(t)}function u(t){if("string"!=typeof t)return!1;return"string"==typeof t&&t.trim()&&!e(t)&&!/["*:<>?\/\\|]+/.test(t)}function l(t,n){if("string"!=typeof t)return!1;const d=n?/^([A-Za-z]{1}:\\|\\\\)([^":<>\/\\|]+\\?)+([^":<>\/\\|]+)$/:/^([A-Za-z]{1}:\\|\\\\)([^"*:<>?\/\\|]+\\?)+([^"*:<>?\/\\|]+)$/;return"string"==typeof t&&t.trim()&&!e(t)&&d.test(t)}function p(t){if("string"!=typeof t)return!1;return"string"==typeof t&&t.trim()&&!e(t)&&/^(((CN|2\.5\.4\.3|UID|0\.9\.2342\.19200300\.100\.1\.1) *= *([^,]*)))?( *,? *(((?:CN|2\.5\.4\.3|OU|2\.5\.4\.11) *= *[^,]+,?)+))?( *,? *((DC|0\.9\.2342\.19200300\.100\.1\.25) *= *[^,]+)+)*$/i.test(t)}function A(t){return"string"==typeof t&&/^\+?[0-9)( -]{5,20}$/.test(t)}function g(t){return"string"==typeof t&&/[A-Z]+/.test(t)}function c(t){return"string"==typeof t&&/[a-z]+/.test(t)}function h(t){return"string"==typeof t&&/[0-9]+/.test(t)}function y(t){return"string"==typeof t&&/[!-/]+|[:-@]+|[[-`]+|[{-~]/.test(t)}function x(t,e){return{special:!e||y(t),lower:c(t),upper:g(t),number:h(t),length:t.length}}const O={domain:f,email:a,hasControlCharacters:n,hasLowerCase:c,hasNumber:h,hasSpecial:y,hasUpperCase:g,header:r,headerName:d,headerValue:i,isInt:o,ldapDN:p,ip:s,password:x,phoneNumber:A,windowsFileName:u,windowsPath:l};t.default=O,t.hasControlCharacters=n,t.hasLowerCase=c,t.hasNumber=h,t.hasSpecial=y,t.hasUpperCase=g,t.validateDomain=f,t.validateEmailAddress=a,t.validateHeader=r,t.validateHeaderName=d,t.validateHeaderValue=i,t.validateIPAddress=s,t.validateInt=o,t.validateLdapDN=p,t.validatePassword=x,t.validatePhoneNumber=A,t.validateWindowsFileName=u,t.validateWindowsPath=l,Object.defineProperty(t,"__esModule",{value:!0})}));
