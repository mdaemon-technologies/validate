function e(e){return"string"==typeof e&&/\u000d|\u000a/g.test(e)}function r(r){return"string"==typeof r&&/\u0008|\u000c|\u0009|\u000b/g.test(r)||e(r)}function t(e){return"string"==typeof e&&e.length&&!r(e)&&/^[A-Za-z\-]+$/g.test(e)&&!/(^-)|(-$)/.test(e)}function n(e){return"string"==typeof e&&e.length&&!r(e)}function i(e){if("string"!=typeof e||-1===e.indexOf(":"))return!1;const r=e.substring(0,e.indexOf(":")).trim(),i=e.substring(e.indexOf(":")+1).trim();return t(r)&&n(i)}function s(e,r){if("string"!=typeof e)return!1;if(r&&(-1!==e.indexOf("*")||-1!==e.indexOf("?")))return/[\S]+@[\S]+/.test(sAddr);return/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\"[^\"\\]+\"))@((\[(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(e.trim())}function o(e,t){return"string"==typeof e&&(!r(e)&&(!/[()<>\[\]:;@\ ]/gm.test(e)&&(t?/^[0-9a-zA-Z.?\-*#]+\.[0-9a-zA-Z.?\-*#]+$/g.test(e):/^[0-9a-zA-Z.\-]+\.[0-9a-zA-Z.\-]+$/g.test(e))))}function u(e,r){if("string"!=typeof e)return!1;const t=-1===e.indexOf(".")&&-1!==e.indexOf(":");if(r){let r=e.indexOf("*");if(-1===r&&(r=e.indexOf("#")),-1===r&&(r=e.indexOf("?")),t){if(-1!==r)return r=e.indexOf(":"),-1!==r&&(r=e.indexOf(":",r+1),-1!==r&&(r=e.indexOf(":",r+1),-1!==r))}else{if(-1!==r)return r=e.indexOf("."),-1!==r&&(r=e.indexOf(".",r+1),-1!==r&&(r=e.indexOf(".",r+1),-1!==r));if(r=e.indexOf("/"),-1!==r&&-1===e.indexOf("."))return r=e.indexOf(":"),-1!==r&&(r=e.indexOf(":",r),-1!==r)}}let n=/\d/;return!!n.test(e)&&(t&&/\/\d{1,3}$/.test(e)&&(e=e.substr(0,e.lastIndexOf("/"))),n=/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$|^(((2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)\.){3}(2(5[0-5]|[0-4][0-9])|[01]?[0-9][0-9]?)(\/(3[012]|[12]?[0-9])))$/,n.test(e))}function a(e){return!("string"!=typeof e||e.length<1)&&/^\d*$/.test(e)}function f(r){if("string"!=typeof r)return!1;return"string"==typeof r&&r.trim()&&!e(r)&&!/["*:<>?\/\\|]+/.test(r)}function d(r,t){if("string"!=typeof r)return!1;const n=t?/^([A-Za-z]{1}:\\|\\\\)([^":<>\/\\|]+\\?)+([^":<>\/\\|]+)$/:/^([A-Za-z]{1}:\\|\\\\)([^"*:<>?\/\\|]+\\?)+([^"*:<>?\/\\|]+)$/;return"string"==typeof r&&r.trim()&&!e(r)&&n.test(r)}function p(r){if("string"!=typeof r)return!1;return"string"==typeof r&&r.trim()&&!e(r)&&/^(((CN|2\.5\.4\.3|UID|0\.9\.2342\.19200300\.100\.1\.1) *= *([^,]*)))?( *,? *(((?:CN|2\.5\.4\.3|OU|2\.5\.4\.11) *= *[^,]+,?)+))?( *,? *((DC|0\.9\.2342\.19200300\.100\.1\.25) *= *[^,]+)+)*$/i.test(r)}function m(e){return"string"==typeof e&&/^\+?[0-9)( -]{5,20}$/.test(e)}function l(e){return"string"==typeof e&&/[A-Z]+/.test(e)}function g(e){return"string"==typeof e&&/[a-z]+/.test(e)}function h(e){return"string"==typeof e&&/[0-9]+/.test(e)}function c(e){return"string"==typeof e&&/[!-/]+|[:-@]+|[[-`]+|[{-~]/.test(e)}const y={requireUpper:!1,requireLower:!1,requireNumber:!1,requireSpecial:!1,requireMinLength:-1,requireMaxLength:-1,setByUser:!1};function x(e){return void 0!==e.upper&&(y.requireUpper=!!e.upper),void 0!==e.lower&&(y.lower=!!e.lower),void 0!==e.special&&(y.requireSpecial=!!e.special),void 0!==e.number&&(y.requireNumber=!!e.number),"number"==typeof e.min&&e.min>0&&(y.requireMinLength=e.min),"number"==typeof e.max&&e.max>0&&(y.requireMaxLength=e.max),y.max>0&&y.min>0&&y.max<=y.min?(console.error("The minimum password length requirement must be less than the maximum password length requirement"),!1):(y.setByUser=!0,!0)}function b(){y.requireUpper=!1,y.requireLower=!1,y.requireNumber=!1,y.requireSpecial=!1,y.requireMinLength=-1,y.requireMaxLength=-1,y.setByUser=!1}function A(e,r,t,n){let i={};if("string"!=typeof e)return i={special:!1,lower:!1,upper:!1,number:!1,length:0},("number"==typeof t||y.setByUser&&y.requireMinLength>0)&&(i.min=!1),("number"==typeof n||y.setByUser&&y.requireMaxLength>0)&&(i.max=!1),i;if(y.setByUser){let s=Object.assign(y);return(s.requireSpecial&&void 0===r||r)&&(i.special=c(e)),s.requireMinLength>0&&"number"!=typeof t?i.min=e.length>=s.requireMinLength:"number"==typeof t&&t>0&&(i.min=e.length>=t),s.requireMaxLength>0&&"number"!=typeof n?i.max=e.length<=s.requireMaxLength:"number"==typeof n&&n>0&&(i.max=e.length<=n),s.requireLower&&(i.lower=g(e)),s.requireUpper&&(i.upper=l(e)),s.requireNumber&&(i.number=h(e)),i}return i={special:!r||c(e),lower:g(e),upper:l(e),number:h(e),length:e.length},"number"==typeof t&&(i.min=e.length>=t),"number"==typeof n&&(i.max=e.length<=n),i}function v(e,r,t,n){if("string"!=typeof e)return!1;let i=A(e,r,t,n);return!(void 0!==i.lower&&!i.lower)&&(!(void 0!==i.upper&&!i.upper)&&(!(void 0!==i.number&&!i.number)&&(!(void 0!==i.special&&!i.special)&&(!(void 0!==i.min&&!i.min)&&!(void 0!==i.max&&!i.max)))))}const q=new Map;function $(e){if(!e)return e;if("function"==typeof e)return e;if(Array.isArray(e))return e.map((e=>$(e)));if("object"==typeof e){const r={};for(const t in e)Object.prototype.hasOwnProperty.call(e,t)&&(r[t]=$(e[t]));return r}return e}function w(e){return $(q.get(e))}function O(e,r){if(!e||"string"!=typeof e)throw new TypeError("A string is required for the schema name");q.set(e,$(r))}function L(e,r,t){"number"!=typeof t&&(t=0);const n={valid:!0,errors:[]};if(e.type){const i=typeof r;if("number"===e.type&&"number"!==i?(n.valid=!1,n.errors.push(`Expected number, got ${i}`)):"string"===e.type&&"string"!==i?(n.valid=!1,n.errors.push(`Expected string, got ${i}`)):"boolean"===e.type&&"boolean"!==i?(n.valid=!1,n.errors.push(`Expected boolean, got ${i}`)):"array"!==e.type||Array.isArray(r)?"object"===e.type&&"object"!==i&&(n.valid=!1,n.errors.push(`Expected object, got ${i}`)):(n.valid=!1,n.errors.push(`Expected array, got ${i}`)),"array"===e.type&&Array.isArray(r))"object"==typeof e.arraySchema&&t<10&&r.forEach(((r,i)=>{const s=L(e.arraySchema,r,t+1);s.valid||(n.valid=!1,s.errors.forEach((e=>{n.errors.push(`[${i}]: ${e}`)})))}));else if("object"===e.type&&"object"===i&&e.properties&&t<10)for(const i in e.properties){const s=L(e.properties[i],r[i],t+1);s.valid||(n.valid=!1,s.errors.forEach((e=>{n.errors.push(`${i}: ${e}`)})))}}return e.required&&null==r&&(n.valid=!1,n.errors.push("Value is required")),"number"==typeof e.minLength&&"string"==typeof r&&r.length<e.minLength&&(n.valid=!1,n.errors.push(`Minimum length is ${e.minLength}`)),"number"==typeof e.maxLength&&"string"==typeof r&&r.length>e.maxLength&&(n.valid=!1,n.errors.push(`Maximum length is ${e.maxLength}`)),"number"==typeof e.minimum&&"number"==typeof r&&r<e.minimum&&(n.valid=!1,n.errors.push(`Minimum value is ${e.minimum}`)),"number"==typeof e.maximum&&"number"==typeof r&&r>e.maximum&&(n.valid=!1,n.errors.push(`Maximum value is ${e.maximum}`)),"number"==typeof e.minItems&&Array.isArray(r)&&r.length<e.minItems&&(n.valid=!1,n.errors.push(`Minimum length is ${e.minItems}`)),"number"==typeof e.maxItems&&Array.isArray(r)&&r.length>e.maxItems&&(n.valid=!1,n.errors.push(`Maximum length is ${e.maxItems}`)),Array.isArray(e.options)&&e.options.length&&!e.options.includes(r)&&(n.valid=!1,n.errors.push(`Invalid value, expected one of: ${e.options.join(", ")}`)),"function"!=typeof e.validate||e.validate(r)||(n.valid=!1,n.errors.push("Custom validation failed")),"string"!=typeof e.pattern||"string"!=typeof r||new RegExp(e.pattern).test(r)||(n.valid=!1,n.errors.push(`Value does not match pattern ${e.pattern}`)),n}function F(e){return r=>{const t=[],n=L(q.get(e),r);return n.valid||t.push(...n.errors),{valid:0===t.length,errors:t}}}function M(e,r){if(!e||"string"!=typeof e)throw new TypeError("A string is required for the schema name");if(!r||"object"!=typeof r)throw new TypeError("A JSON object is required for the schema");return O(e,r),F(e)}const z={domain:o,email:s,createSchemaValidator:M,getSchema:w,updateSchema:O,hasControlCharacters:r,hasLowerCase:g,hasNumber:h,hasSpecial:c,hasUpperCase:l,header:i,headerName:t,headerValue:n,isInt:a,ldapDN:p,ip:u,password:A,isValidPassword:v,phoneNumber:m,resetPasswordRequirements:b,setPasswordRequirements:x,windowsFileName:f,windowsPath:d};export{M as createSchemaValidator,z as default,w as getSchema,r as hasControlCharacters,g as hasLowerCase,h as hasNumber,c as hasSpecial,l as hasUpperCase,v as isValidPassword,b as resetPasswordRequirements,x as setPasswordRequirements,O as updateSchema,o as validateDomain,s as validateEmailAddress,i as validateHeader,t as validateHeaderName,n as validateHeaderValue,u as validateIPAddress,a as validateInt,p as validateLdapDN,A as validatePassword,m as validatePhoneNumber,f as validateWindowsFileName,d as validateWindowsPath};
