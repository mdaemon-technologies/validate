# @mdaemon/validate

[![npm](https://img.shields.io/npm/v/@mdaemon/validate?color=blue)](https://www.npmjs.com/package/@mdaemon/validate)
[![license](https://img.shields.io/npm/l/@mdaemon/validate?color=green)](LICENSE)
[![node](https://img.shields.io/node/v/@mdaemon/validate)](https://nodejs.org)
[![install size](https://img.shields.io/npm/unpacked-size/@mdaemon/validate)](https://packagephobia.com/result?p=@mdaemon/validate)
[![CI](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml/badge.svg)](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml)

A validation library used by MDaemon Remote Administration

A zero runtime dependency input validation library. The "validate" utility provides several validation methods, from domains to ipv6, and email to LDAP, and schema validation methods.

The validators never throw on bad input: a value of the wrong type (`null`, a number, and so on) returns `false`.

## Install

```bash
npm install @mdaemon/validate
```

Requires Node.js 18 or later. In the browser, use the UMD bundle (see below). The bundles are ES2020, so they run in any current browser.

## Usage

### ES modules

Recommended for Node.

```js
// Import the default export
import validate from "@mdaemon/validate";

// Import specific functions
import { validateDomain, validateEmailAddress } from "@mdaemon/validate";
```

### CommonJS

```js
// Require the default export (note: .default is required due to named exports)
const validate = require("@mdaemon/validate").default;

// Destructuring specific functions
const { validateDomain, validateEmailAddress } = require("@mdaemon/validate");
```

Only the package root (and `@mdaemon/validate/package.json`) can be imported; deep paths such as `@mdaemon/validate/dist/validate.cjs` are blocked by the package's `exports` map.

### Browser (UMD)

```html
<script type="text/javascript" src="/path_to_modules/@mdaemon/validate/dist/validate.umd.js"></script>
<script>
  // Access via the default export on the global 'validate' object
  const isValid = validate.default.domain("example.com");

  // Or use the named exports directly
  const isValidDomain = validate.validateDomain("example.com");
</script>
```

### TypeScript

```ts
// Import with full TypeScript support
import validate from "@mdaemon/validate";
import { validateDomain } from "@mdaemon/validate";
import type { ISchema, ISchemaValidationResult, MDaemonValidPassword } from "@mdaemon/validate";
```

## TypeScript Support

The package ships its own type declarations, for both ES module (`import`) and CommonJS (`require`) consumers. It exports these types:

- `ISchema` - A validation schema
- `ISchemaValidationResult` - The result of a schema validator: `{ valid: boolean, errors: string[] }`
- `MDaemonPasswordRequirements` - The options accepted by `setPasswordRequirements`
- `MDaemonValidPassword` - The result of `password` / `validatePassword`. `length` and `controlCharacters` are always present. Once password requirements are set, the other checks are present only when enforced, so test them with `=== false`. `controlCharacters` and `badPassword` are `true` when the password fails.
- `MDaemonValidate` - The default `validate` object

## Wildcards

The `domain`, `email`, `ip` and `windowsPath` validators accept wildcard patterns when their `useWildCards` argument is `true`:

- `?` matches exactly one character
- `#` matches exactly one digit (in `email`, only `*` and `?` make an address a pattern)
- `*` matches any number of characters

A pattern is checked for its shape, so it must still be able to match something: an IPv4 pattern needs four octets, each able to match a value from 0 to 255 (so `3##` is rejected), and a domain pattern needs two or more labels. Email patterns are the exception: their domain may be a single label (`*@mdaemon???`). Domain patterns, and the domain part of email patterns, are ASCII only; a domain without wildcard characters is checked as a real domain, so `validate.domain("bücher.de", true)` is `true`.

In `email`, a real address that contains `*` or `?` (such as `"what?"@example.com`) is still accepted when `useWildCards` is `true`.

### Validate domain syntax

```js
validate.domain("mdaemon.com"); // true
validate.domain("mail.mdaemon.com."); // true (a trailing root dot is allowed)
validate.domain("mdaemon"); // false (at least two labels are required)
validate.domain("-mdaemon.com"); // false (labels cannot start or end with a hyphen)
validate.domain("mdaemon..com"); // false (labels cannot be empty)
validate.domain("example.123"); // false (the last label cannot be all digits)
validate.domain("bücher.de"); // true (internationalized domain names are allowed)

// use wild cards
validate.domain("mdaemon.*", true); // true
validate.domain("*.mdaemon.com", true); // true
```

Each label is 1-63 letters, digits and inner hyphens, the last label is not all digits (so `1.2.3.4` is not a domain), and the whole name is at most 253 characters.

Internationalized labels (U-labels such as `bücher`) are converted to their A-label form (`xn--bcher-kva`) with the platform's IDNA support, and the length limits apply to that form. A U-label holds letters, combining marks, digits and inner hyphens, must be in Unicode NFC, and is separated from the next label by an ASCII dot. A label that IDNA would change into other characters, such as fullwidth `ｅｘａｍｐｌｅ`, is rejected; only case is folded. A-labels (`xn--`) are checked for their letters-digits-hyphens shape, not decoded.

### Validate email address syntax

```js
validate.email("tommy@mdaemon.com"); // true
validate.email("tommy.com"); // false
validate.email("tommy@mdaemon.com\r\n"); // false (control characters are rejected)
validate.email("tommy@-mdaemon.com"); // false (the domain must pass validate.domain)
validate.email("tommy@example.xn--p1ai"); // true
validate.email("tommy@[192.0.2.1]"); // true
validate.email("tommy@[IPv6:2001:db8::1]"); // true
validate.email('"tommy \\"t\\" smith"@mdaemon.com'); // true (quoted local part with quoted pairs)
validate.email("tömmy@bücher.de"); // true (internationalized addresses are allowed)
validate.email("a".repeat(65) + "@mdaemon.com"); // false (the local part is at most 64 octets)

// use wild cards * or ?
validate.email("*@mdaemon???", true); // true
validate.email("*@*.mdaemon.com", true); // true
validate.email("<script>@x*", true); // false
```

The address follows the RFC 5321 mailbox syntax, extended for internationalized addresses (RFC 6531). Comments, folding whitespace and the other RFC 5322 forms are not accepted.

- **Local part:** a dot-atom (`tommy.smith`) or a quoted string (`"tommy smith"`), at most 64 octets in UTF-8. In a quoted string, a backslash escapes the next character (`"a\"b"`, `"a\\b"`), which must be printable ASCII. An empty quoted string (`""@mdaemon.com`) is rejected: RFC 5321 permits it, but it is almost always a mistake.
- **Domain part:** a host name or an address literal.
  - A host name must pass `validate.domain` and has no trailing dot. Its last label can't be all digits, so write `tommy@[192.0.2.1]`, not `tommy@192.0.2.1`. A single-label name such as `localhost` is rejected.
  - An address literal is an IPv4 address (`[192.0.2.1]`, leading zeros allowed) or an IPv6 address tagged `IPv6:` in any case (`[IPv6:2001:db8::1]`), with no prefix length or zone ID. It follows RFC 5321's IPv6 grammar, where `::` stands for at least two groups. Other tags (`[x-tag:...]`) are rejected, because `IPv6` is the only tag registered with IANA.

Addresses longer than 254 octets in UTF-8 are rejected, after leading and trailing ASCII spaces are trimmed. Other whitespace at the ends, such as U+00A0, U+FEFF or U+2028 (a JavaScript line terminator), is not trimmed, so the address is rejected: you keep the string you validated, and it should not carry those characters. So are addresses that contain a control character anywhere, including inside a quoted local part or at the start or end: C0 (U+0000–U+001F), DEL (U+007F) and, as RFC 6530 requires for mailbox names, C1 (U+0080–U+009F). Unpaired UTF-16 surrogates are rejected too, because they can't be encoded as UTF-8. Other non-ASCII characters are allowed in the local part, including invisible ones such as U+200B; check for those yourself if they matter to you.

### Validate ipv4 and ipv6 address syntax

```js
validate.ip("2001:0db8:85a3:0000:0000:8a2e:0370:7334"); // true
validate.ip("::"); // true
validate.ip("192.168.0.0/16"); // true (CIDR prefix lengths are allowed)
validate.ip("fe80::1%eth0"); // true (IPv6 zone IDs are allowed)
validate.ip("2001:db8::/129"); // false (IPv6 prefix lengths are 0-128)
validate.ip("10"); // false

// use wild cards * or ? or #
validate.ip("10.*.*.###", true); // true
validate.ip("192.168.?.1", true); // true
validate.ip("10.*.*.*/8", true); // true
validate.ip("fe80::*", true); // true
validate.ip("evil.example.com.*", true); // false

validate.ipv4("2001:0db8:85a3:0000:0000:8a2e:0370:7334"); // false
validate.ipv4("10.10.50.1"); // true

validate.ipv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334"); // true
validate.ipv6("::ffff:10.10.50.1"); // true (IPv4-mapped IPv6)
validate.ipv6("10.10.50.1"); // false
validate.ipv6("fe80::1\r\n"); // false (control characters are rejected)
```

IPv4 octets have no leading zeros (`010.0.0.1` is rejected, with or without a prefix length), because some systems read them as octal. An IPv6 address may have ASCII spaces around it; an IPv4 address may not, and no other whitespace is allowed. `ipv4` and `ipv6` accept prefix lengths too, and `ipv6` accepts zone IDs.

### Validate LDAP DN syntax

`ldapDN` parses the string representation of a distinguished name defined by [RFC 4514](https://www.rfc-editor.org/rfc/rfc4514):

- A DN is one or more RDNs separated by `,`. An RDN is one or more `type=value` pairs joined by `+` (a multi-valued RDN). RDNs may appear in any order.
- An attribute type is a name (`cn`, `o`, `mail`, `commonName`; a letter, then letters, digits and hyphens; case-insensitive) or a numeric OID (`2.5.4.3`, with no leading zeros and no `OID.` prefix).
- A value is either a string or `#` followed by pairs of hex digits (a BER encoding).
- In a string value, `"`, `+`, `,`, `;`, `<`, `>` and `\` must be escaped with a backslash. A backslash may escape those characters, a space, `#` or `=`, or start a two-digit hex escape (`\2C`, `\C4\8D`). Hex escapes must spell out valid UTF-8, and lone UTF-16 surrogates are rejected.
- `;` is not accepted as an RDN separator (RFC 4514 dropped it).

It is deliberately more lenient than RFC 4514 in a few ways:

- Spaces are allowed around `=`, `,` and `+`, so a value may also start or end with an unescaped space.
- An attribute value may be empty (`cn=`).

The empty DN (`""`), which RFC 4514 allows, and whitespace-only strings are rejected. Raw control characters (U+0000-U+001F and DEL) are rejected anywhere; their escaped forms (`\00`, `\0d`) are accepted.

```js
validate.ldapDN("CN=test,OU=test,DC=test"); // true
validate.ldapDN("uid=john,ou=Group,dc=mdaemon,dc=com"); // true
validate.ldapDN("CN=Smith\\, John,OU=Sales,DC=example,DC=com"); // true (escaped comma)
validate.ldapDN("OU=Sales+CN=J. Smith,DC=example,DC=net"); // true (multi-valued RDN)
validate.ldapDN("1.3.6.1.4.1.1466.0=#04024869,O=Example"); // true (numeric OID, hex value)
validate.ldapDN("CN=John Smith, OU=Sales, DC=corp, DC=com"); // true (spaces after commas)
validate.ldapDN("test"); // false
validate.ldapDN(""); // false
validate.ldapDN("cn=a+b"); // false ("+" must be escaped unless it starts another type=value)
validate.ldapDN("cn=a;dc=b"); // false (";" is not a separator)
validate.ldapDN("cn=a,,dc=b"); // false (empty RDN)
validate.ldapDN("cn=a\\zz"); // false (invalid escape)
validate.ldapDN("CN=te\tst,DC=test"); // false (control characters are rejected)
```

### Validate windows file name

```js
validate.windowsFileName("test.txt"); // true
validate.windowsFileName("~test.txt"); // true
validate.windowsFileName("test?.txt"); // false (" * : < > ? / \ | are not allowed)
validate.windowsFileName("test\t.txt"); // false (control characters are not allowed)
validate.windowsFileName(".profile"); // true (a name can start with a period)
validate.windowsFileName("test."); // false (a name cannot end in a period or a space)
validate.windowsFileName(".."); // false
validate.windowsFileName("nul.txt"); // false (reserved device name)
```

A name is 1-255 characters. These are rejected:

- the reserved characters `" * : < > ? / \ |`
- control characters U+0000–U+001F and DEL (U+007F). C1 characters (U+0080–U+009F) are legal and accepted.
- a name that ends in a period or a space (U+0020), which Windows strips. This also rejects `.`, `..` and names made only of spaces. Other Unicode whitespace, such as U+00A0, is an ordinary character.
- the reserved device names `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`, and `COM¹`, `COM²`, `COM³`, `LPT¹`, `LPT²`, `LPT³`, in any case and with any extension (`NUL.tar.gz`). `COM0` and `LPT0` are not reserved.

### Validate windows path

```js
validate.windowsPath("C:\\test\\this\\path"); // true
validate.windowsPath("\\\\server\\share\\file.txt"); // true
validate.windowsPath("C:\\test\\..\\other"); // true ("." and ".." are allowed after the drive or share)
validate.windowsPath("C:\\test\n"); // false
validate.windowsPath("C:\\test\\"); // false (no trailing separator)
validate.windowsPath("C:\\"); // false (a drive or share root is never valid)
validate.windowsPath("C:\\ \\test"); // false (a folder name cannot be only spaces)
validate.windowsPath("C:\\test.\\file"); // false (each segment follows the windowsFileName rules)
validate.windowsPath("C:\\test\\CON"); // false
validate.windowsPath("C:/test"); // false (only backslashes separate segments)
validate.windowsPath("test\\file"); // false (relative paths are not accepted)
validate.windowsPath("\\\\server"); // false (a UNC path needs a server and a share)
validate.windowsPath("\\\\.\\COM1"); // false (device paths are not supported)
validate.windowsPath("\\\\?\\C:\\test"); // false (extended-length paths are not supported)
validate.windowsPath("C:\\file.txt:stream"); // false (alternate data streams are not accepted)

// use wild cards
validate.windowsPath("C:\\*", true); // true
validate.windowsPath("C:\\logs\\*.log", true); // true
validate.windowsPath("\\\\?\\share", true); // true ("?" is a one-character server name)
```

Only fully qualified paths are accepted: a drive letter (`C:\dir\file`) or a UNC path with a server and a share (`\\server\share\dir\file`). Each segment after the drive or share follows the `windowsFileName` rules, except that `.` and `..` are allowed. The share must be a real name, and the server cannot be `.` or `..`. A segment is at most 255 characters and the whole path at most 32,767. In wildcard mode `*` does not count toward either limit.

### Validate value is an int as opposed to a float

```js
validate.isInt("1"); // true
validate.isInt("1.1"); // false
validate.isInt("007"); // true (digits only; leading zeros are allowed)
validate.isInt("-5"); // false
```

### Validate HTTP headers

```js
validate.headerName("X-Test-Name"); // true
validate.headerName("Content-MD5"); // true
validate.headerName("-X-Test"); // true (any RFC 9110 token)
validate.headerName("X_Custom.Header~1"); // true
validate.headerName("X=Test=Name"); // false
validate.headerName("X Test"); // false

validate.headerValue("1"); // true
validate.headerValue("default-src 'self' example.com *.example.com"); // true
validate.headerValue("a\tb"); // true
validate.headerValue(""); // true (an empty value is valid)
validate.headerValue("default-src 'self' \n"); // false
validate.headerValue("čĊSet-Cookie: x=1"); // false (above U+00FF)

validate.header("Content-Security-Policy: default-src 'self'"); // true
validate.header("X-Test:\tvalue"); // true
validate.header("X-Test:"); // true
validate.header("X-Frame-Options"); // false
validate.header("X-Frame-Options : DENY"); // false (whitespace before the colon)
validate.header(" X-Frame-Options: DENY"); // false (whitespace before the name)
validate.header("X-Frame-Options: DENY\r\n"); // false (control characters are rejected anywhere)
```

- `headerName` accepts an RFC 9110 token: one or more letters, digits or `` ! # $ % & ' * + - . ^ _ ` | ~ ``, in any position.
- `headerValue` accepts only tab, U+0020–U+007E and U+0080–U+00FF (the characters Node's `http` module allows). It rejects CR, LF, NUL and every other control character, DEL, and anything above U+00FF, which a Latin-1 encoder could turn into a CR or LF. An empty value is valid. It validates a value on its own, so leading and trailing spaces and tabs are accepted.
- `header` validates a `name:value` line (RFC 9112). The name must start the line and end at the first colon, with no whitespace before or after it. Spaces and tabs may surround the value, and the value may be empty. Nothing else is trimmed, so Unicode whitespace such as U+00A0 or U+2028 is not stripped: before the name it is rejected, and in the value it follows the `headerValue` rules.

### Validate phone number syntax

```js
validate.phoneNumber("+1 (832) 526-7777"); // true
validate.phoneNumber("+18325267777"); // true
validate.phoneNumber("+49 (0) 30 1234 5678 90"); // true (15 digits)
validate.phoneNumber("00000"); // true (leading zeros are fine without "+")
validate.phoneNumber("((((("); // false (at least five digits are required)
validate.phoneNumber("555"); // false
validate.phoneNumber("+0 123 456 7890"); // false (a country code can't start with 0)
validate.phoneNumber("12--345"); // false (separators can't repeat)
validate.phoneNumber("832.526.7777"); // false (dots aren't allowed)
```

`phoneNumber` checks syntax only, not whether the number exists:

- Surrounding ASCII spaces are ignored. Any other character outside digits (`0`-`9`), space, hyphen, parentheses and a leading `+` makes the number invalid. That includes dots, slashes, tabs, letters, extensions such as `x123`, and non-ASCII digits.
- The number must contain 5 to 15 digits. 15 is the ITU-T E.164 maximum. Every digit counts, including a trunk prefix such as `(0)` and dialing prefixes such as `00` or `011`. Spaces, hyphens, parentheses and `+` don't count toward either limit.
- A `+` may appear only first, and must be followed directly by a digit from 1 to 9 (`"+ 12345"`, `"+(1) 832 526 7777"` and `"+00000"` are invalid).
- Digits may be separated by a single space or hyphen. A separator can't come first or last, or follow another separator (`"-12345"`, `"12345-"`, `"12 -345"` are invalid).
- At most one parenthesized group is allowed. It holds only digits (`"( 832)"` is invalid), may be preceded by digits, and must be followed by more digits: `"(832) 526-7777"`, `"+1(832)526-7777"` and `"+49 (0) 30 1234"` are valid; `"(12345"`, `"(1)(2)345"` and `"12345 (6)"` are not. A single separator may sit on either side of the group (`"(832)-526-7777"`), but not two (`"(832) -526-7777"`).

### Check for control characters

```js
// any C0 control character (U+0000-U+001F) or DEL (U+007F)
validate.hasControlCharacters("line one\nline two"); // true
validate.hasControlCharacters("plain text"); // false
```

### Validate password requirements

```js
// do not require special characters
validate.password("Test this Password1");
/*
    {
        special: true,
        lower: true,
        upper: true,
        number: true,
        length: 19,
        controlCharacters: false
    }
*/

// require special characters
validate.password("test this one1", true);
/*
    {
        special: false,
        lower: true,
        upper: false,
        number: true,
        length: 14,
        controlCharacters: false
    }
*/

// include a minimum (and/or maximum) length
validate.password("Test1", false, 8);
/*
    {
        special: true,
        lower: true,
        upper: true,
        number: true,
        length: 5,
        controlCharacters: false,
        min: false
    }
*/

// validate each part individually
validate.hasLowerCase("Test Password@1"); // true
validate.hasLowerCase("TEST PASSWORD"); // false

validate.hasUpperCase("Test Password@1"); // true
validate.hasUpperCase("test password"); // false

validate.hasNumber("Test Password@1"); // true
validate.hasNumber("test password"); // false

validate.hasSpecial("Test Password@1"); // true
validate.hasSpecial("test password1"); // false

// by default a valid password needs upper case, lower case and a number
validate.isValidPassword("TestPassword1"); // true

// include bRequireSpecial
validate.isValidPassword("TestPassword1", true); // false

// include min and max length of the password, or just min length
validate.isValidPassword("TestPassword1*", true, 4, 20); // true

// a min or max length below 1 means "no limit"
validate.isValidPassword("TestPassword1", false, 0, 0); // true

// control characters are never valid, whatever the requirements
validate.isValidPassword("TestPassword1\r\n"); // false
validate.password("TestPassword1\r\n");
/*
    {
        special: true,
        lower: true,
        upper: true,
        number: true,
        length: 15,
        controlCharacters: true
    }
*/
```

`controlCharacters` is `true` when the password contains a control character (U+0000–U+001F or U+007F), which makes it invalid. Unlike the other checks, it is always present, even once requirements are set. `isValidPassword` returns `false` whenever it is `true`.

The character checks are ASCII-only. Upper case is `A`–`Z`, lower case is `a`–`z` and a number is `0`–`9`, so letters such as `É` or `Σ` and digits such as fullwidth `１` don't count. A special character is ASCII punctuation or a symbol (``!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~``); a space is not one. Lengths count UTF-16 code units, as `String.prototype.length` does, so an emoji such as 😀 counts as 2.

`setPasswordRequirements` replaces the default rules. Once it has been called, **only** the requirements you enable are enforced (the default upper case / lower case / number rule no longer applies) until `resetPasswordRequirements` is called. It returns `false`, and changes nothing, when `min` is not less than `max` or when the argument is not an object. Values of `min` and `max` below 1 (including fractions such as `0.5`) are ignored, and so are `nMinLength` and `nMaxLength` below 1.

```js
validate.setPasswordRequirements({
  upper: true,
  lower: true,
  number: false,
  special: true,
  min: 6,
  max: 16
}); // true

validate.isValidPassword("TestPassword*"); // true

// once requirements are set, the result only contains the checks being enforced
validate.password("TestPassword*");
/*
    {
        length: 13,
        controlCharacters: false,
        special: true,
        lower: true,
        upper: true,
        min: true,
        max: true
    }
*/

// settings not passed are kept
validate.setPasswordRequirements({ upper: false }); // true

// min must stay less than max (16), so this is rejected and nothing changes
validate.setPasswordRequirements({ min: 20 }); // false

// you can override the requirements for special, min length, and max length
validate.isValidPassword("testpassword", false); // true

validate.resetPasswordRequirements();

validate.isValidPassword("testpassword*"); // false

// only the enabled requirements apply, so this drops the default upper/lower/number rule
validate.setPasswordRequirements({ min: 8 });
validate.isValidPassword("aaaaaaaa"); // true

validate.resetPasswordRequirements();

// use badPasswords to prevent common or compromised passwords
validate.setPasswordRequirements({
  upper: true,
  lower: true,
  number: true,
  special: true,
  min: 8,
  max: 64,
  badPasswords: ["password1!", "123456", "qwerty", "letmein", "admin"]
});

// meets every requirement, but is in the bad passwords list (compared case-insensitively)
validate.isValidPassword("Password1!"); // false
validate.password("Password1!").badPassword; // true
validate.password("PASSWORD1!").badPassword; // true

// an empty list clears the bad passwords
validate.setPasswordRequirements({ badPasswords: [] });
validate.isValidPassword("Password1!"); // true

validate.resetPasswordRequirements();
```

### Validate Custom Schema

`createSchemaValidator(name, schema)` registers a schema under a name and returns a validator function. The validator returns `{ valid, errors }`, where `errors` is an array of strings. Errors for nested values are prefixed with the property name (`"name: "`) or the array index (`"[0]: "`).

A schema supports `type` (`"string"`, `"number"`, `"boolean"`, `"array"` or `"object"`), `required`, `minLength` / `maxLength` (strings), `minimum` / `maximum` (numbers), `minItems` / `maxItems` (arrays), `options` (allowed values), `pattern` (a regular expression string; a `RegExp` object also works), `validate` (a custom function), `properties` (objects) and `arraySchema` (the schema for each array item).

- A value that is `undefined` (an omitted property) only fails `required`; every other check is skipped.
- `null` is a real value: it fails a `type` check, and a required `null` is reported as `"Value is required"`.
- Arrays do not satisfy `type: "object"`.
- Only a value's own properties are read. In a sparse array, each run of consecutive holes counts as one absent item, so with a `required` `arraySchema` it gets one error: `"[3]: Value is required"` for a single hole, or `"[3]-[7]: Value is required"` for holes 3 to 7. Otherwise holes are skipped. An explicit `undefined` item is still reported on its own. Checking a sparse array takes time in proportion to its items, not its `length`.
- `NaN` passes `type: "number"`, but fails `minimum` and `maximum`.
- String lengths count UTF-16 code units, as `String.prototype.length` does, so an emoji such as 😀 counts as 2.
- `options` matches with `Array.prototype.includes`, and the schema is copied when it is registered. An object or array in `options` therefore never matches anything, so use primitive values.
- `validate` is called with the value as its only argument, and without a `this`.
- `pattern` runs as you wrote it. A pattern that nests quantifiers, such as `^(a+)+$`, can take exponential time on some input, so keep patterns simple. (`maxLength` doesn't help: every check runs.)
- A validator never throws. A value it can't read, such as a revoked `Proxy` or a property whose getter throws, is reported as `"Value could not be read"` (prefixed with the property name or index when nested). If validation runs out of stack, because the schema is very deep and the caller is already deep in the stack, the result is `{ valid: false, errors: ["Value could not be validated: the stack ran out"] }`.

```js
const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", required: true, minLength: 2 },
    age: { type: "number", minimum: 0, maximum: 120 },
    email: { type: "string", required: true }
  }
};

// Create a validator function for the schema
const validateUser = validate.createSchemaValidator("user", userSchema);

// Validate an object against the schema
validateUser({ name: "John", age: 30, email: "john@example.com" }); // { valid: true, errors: [] }

// optional properties may be omitted
validateUser({ name: "John", email: "john@example.com" }); // { valid: true, errors: [] }

// Invalid object example
validateUser({
  name: "J", // too short
  age: 150, // exceeds maximum
  email: undefined // missing required field
});
/* Returns:
{
  valid: false,
  errors: [
    "name: Minimum length is 2",
    "age: Maximum value is 120",
    "email: Value is required"
  ]
}
*/

// Array schema example
const todoListSchema = {
  type: "array",
  arraySchema: {
    type: "object",
    properties: {
      id: { type: "string", required: true },
      task: { type: "string", required: true, minLength: 1 },
      completed: { type: "boolean", required: true },
      type: { type: "string", required: true, options: ["business", "personal"] }
    }
  },
  minItems: 1,
  maxItems: 10
};

const validateTodoList = validate.createSchemaValidator("todoList", todoListSchema);

validateTodoList([{ id: "1", task: "Buy groceries", completed: false, type: "personal" }]); // { valid: true, errors: [] }

validateTodoList([{ id: "2", task: "", completed: "no", type: "work" }]);
/* Returns:
{
  valid: false,
  errors: [
    "[0]: task: Minimum length is 1",
    "[0]: completed: Expected boolean, got string",
    "[0]: type: Invalid value, expected one of: business, personal"
  ]
}
*/

// Pattern validation example
const usernameSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      required: true,
      pattern: "^[a-zA-Z0-9_]{3,16}$" // Alphanumeric + underscore, 3-16 chars
    }
  }
};

const validateUsername = validate.createSchemaValidator("username", usernameSchema);

validateUsername({ username: "john_doe123" }); // { valid: true, errors: [] }

validateUsername({ username: "j@hn!" });
/* Returns:
{
  valid: false,
  errors: ["username: Value does not match pattern ^[a-zA-Z0-9_]{3,16}$"]
}
*/

// Custom validation function example
const priceSchema = {
  type: "object",
  properties: {
    price: {
      type: "number",
      required: true,
      validate: (value) => {
        // Must be positive with at most 2 decimal places. Test the digits, not
        // Number.isInteger(value * 100): 19.99 * 100 is 1998.9999999999998.
        return value > 0 && /^\d+(\.\d{1,2})?$/.test(String(value));
      }
    }
  }
};

const validatePrice = validate.createSchemaValidator("price", priceSchema);

validatePrice({ price: 19.99 }); // { valid: true, errors: [] }

validatePrice({ price: 19.999 });
/* Returns:
{
  valid: false,
  errors: ["price: Custom validation failed"]
}
*/

// a custom function that throws is reported as an error, not rethrown
const validateCode = validate.createSchemaValidator("code", {
  type: "string",
  validate: () => { throw new Error("lookup failed"); }
});
validateCode("A1"); // { valid: false, errors: ["Custom validation threw: lookup failed"] }
```

A schema is checked and copied when it is registered, so later changes to the object you passed in have no effect. Registering a malformed schema throws a `TypeError`, and leaves any schema already registered under that name in place. That covers:

- an invalid `pattern`, or a `pattern` that is neither a string nor a `RegExp`
- a `type` that isn't one of the five names, including `""`
- a `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` or `maxItems` that isn't a number, or is `NaN` (`Infinity` is allowed, and means no limit)
- an `options` that isn't an array, or a `validate` that isn't a function
- a sub-schema that is not an object, or a circular reference
- objects and arrays nested more than 1000 levels deep, counting every object in the schema: each schema, `properties` object, `options` array and `RegExp`, and anything inside `options` or under a key the schema doesn't use

A schema whose own getters or `Proxy` traps throw is a programmer error too; that error propagates from the registration call as it is, not as a `TypeError`.

Serializers often write `null` for a missing value, so a `null` constraint (any of the keys listed above, or `required`), `properties` or `arraySchema` is treated as absent and left out of the registered copy. `required` is not type-checked: any truthy value makes the value required. A `RegExp` pattern is copied without its `g` and `y` flags, which would make it stateful, and is reported in errors as `/source/flags`. `getSchema` returns it as a `RegExp`.

```js
validate.createSchemaValidator("bad", { type: "string", pattern: "(" }); // throws TypeError
validate.createSchemaValidator("bad", { type: "integer" }); // throws TypeError
validate.createSchemaValidator("bad", { type: "string", minLength: "5" }); // throws TypeError
validate.createSchemaValidator("ok", { type: "string", minLength: null }); // minLength is absent

// getSchema returns a copy of a registered schema (or undefined)
const schema = validate.getSchema("user");

// updateSchema replaces a registered schema; validators already created for
// that name look the schema up when they run, so they use the new one
validate.updateSchema("user", { ...schema, properties: { ...schema.properties, age: { type: "number", minimum: 18 } } });
validateUser({ name: "John", age: 16, email: "john@example.com" }); // { valid: false, errors: ["age: Minimum value is 18"] }
```

## Development

The source is TypeScript in `src/`. Vite bundles it into `dist/validate.mjs` (ES module), `dist/validate.cjs` (CommonJS) and `dist/validate.umd.js` (browser), and `rollup-plugin-dts` bundles the type declarations into `dist/index.d.ts` and `dist/index.d.cts`. Vitest runs the tests. Development needs Node 22.12 or later, because Vitest does; the published package still supports Node 18.

TypeScript 7 type-checks the source. TypeScript 7 has no JavaScript compiler API, so the declaration bundler and the type tests get one from the `@typescript/typescript6` compatibility package.

A small `node:test` smoke suite in `smoke/` checks all three built bundles: the ES module and CommonJS bundles through the package's `exports` map, and the UMD bundle as a browser global. It needs no dependencies, so CI also runs it on Node 18 and 20, where the toolchain itself cannot run.

### Building and running tests

```bash
# Type-check the source, then build dist/
npm run build

# Type-check the source, tests and configs
npm run typecheck

# Run the Vitest suite (several tests read dist/, so build first)
npm test

# Smoke-test the three built bundles with node:test
npm run test:smoke
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Published under the [LGPL-2.1](LICENSE) license.

Published by **MDaemon Technologies, Ltd.**  
Simple Secure Email  
[https://www.mdaemon.com](https://www.mdaemon.com)
