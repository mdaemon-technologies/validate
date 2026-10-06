# @mdaemon/validate

[![npm](https://img.shields.io/npm/v/@mdaemon/validate?color=blue)](https://www.npmjs.com/package/@mdaemon/validate)
[![license](https://img.shields.io/npm/l/@mdaemon/validate?color=green)](LICENSE)
[![node](https://img.shields.io/node/v/@mdaemon/validate)](https://nodejs.org)
[![install size](https://packagephobia.com/badge?p=@mdaemon/validate)](https://packagephobia.com/result?p=@mdaemon/validate)
[![CI](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml/badge.svg)](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml)

A validation library used by MDaemon Remote Administration

A zero runtime dependency input validation library. The "validate" utility provides several validation methods, from domains to ipv6, and email to LDAP, and schema validation methods.

The validators never throw on bad input: a value of the wrong type (`null`, a number, and so on) returns `false`.

## Install

```bash
npm install @mdaemon/validate
```

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
- `MDaemonValidPassword` - The result of `password` / `validatePassword`. Once password requirements are set, only the checks being enforced are present at runtime, so test a field with `=== false`.
- `MDaemonValidate` - The default `validate` object

## Wildcards

The `domain`, `email`, `ip` and `windowsPath` validators accept wildcard patterns when their `useWildCards` argument is `true`:

- `?` matches exactly one character
- `#` matches exactly one digit (in `email`, only `*` and `?` make an address a pattern)
- `*` matches any number of characters

A pattern is checked for its shape, so it must still be able to match something: an IPv4 pattern needs four octets, and a domain pattern needs two or more labels.

### Validate domain syntax

```js
validate.domain("mdaemon.com"); // true
validate.domain("mail.mdaemon.com."); // true (a trailing root dot is allowed)
validate.domain("mdaemon"); // false (at least two labels are required)
validate.domain("-mdaemon.com"); // false (labels cannot start or end with a hyphen)
validate.domain("mdaemon..com"); // false (labels cannot be empty)

// use wild cards
validate.domain("mdaemon.*", true); // true
validate.domain("*.mdaemon.com", true); // true
```

Each label is 1-63 letters, digits and inner hyphens, and the whole name is at most 253 characters.

### Validate email address syntax

```js
validate.email("tommy@mdaemon.com"); // true
validate.email("tommy.com"); // false
validate.email("tommy@mdaemon.com\r\n"); // false (control characters are rejected)

// use wild cards * or ?
validate.email("*@mdaemon???", true); // true
validate.email("*@*.mdaemon.com", true); // true
validate.email("<script>@x*", true); // false
```

Addresses longer than 254 characters are rejected. So are addresses that contain a control character (U+0000–U+001F or U+007F) anywhere, including inside a quoted local part or at the start or end. Other leading and trailing whitespace (spaces, and Unicode spaces such as U+00A0) is trimmed.

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

### Validate LDAP DN syntax

```js
validate.ldapDN("CN=test,OU=test,DC=test"); // true
validate.ldapDN("uid=john,ou=Group,dc=mdaemon,dc=com"); // true
validate.ldapDN("test"); // false
validate.ldapDN("CN=te\tst,DC=test"); // false (control characters are rejected)
```

### Validate windows file name

```js
validate.windowsFileName("test.txt"); // true
validate.windowsFileName("~test.txt"); // true
validate.windowsFileName("test?.txt"); // false (" * : < > ? / \ | are not allowed)
validate.windowsFileName("test\t.txt"); // false (control characters are not allowed)
```

### Validate windows path

```js
validate.windowsPath("C:\\test\\this\\path"); // true
validate.windowsPath("\\\\server\\share\\file.txt"); // true
validate.windowsPath("C:\\test\n"); // false
validate.windowsPath("C:\\test\\"); // false (no trailing separator)
validate.windowsPath("C:\\ \\test"); // false (a folder name cannot be only spaces)

// use wild cards
validate.windowsPath("C:\\*", true); // true
validate.windowsPath("C:\\logs\\*.log", true); // true
```

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
validate.headerName("X=Test=Name"); // false
validate.headerName("-X-Test"); // false

validate.headerValue("1"); // true
validate.headerValue("default-src 'self' example.com *.example.com"); // true
validate.headerValue("default-src 'self' \n"); // false

validate.header("Content-Security-Policy: default-src 'self'"); // true
validate.header("X-Frame-Options"); // false
validate.header("X-Frame-Options: DENY\r\n"); // false (control characters are rejected anywhere)
```

`header` trims whitespace other than control characters (spaces, and Unicode spaces such as U+00A0) around the name and value, but rejects any control character, including a tab after the colon.

### Validate phone number syntax

```js
validate.phoneNumber("+1 (832) 526-7777"); // true
validate.phoneNumber("+18325267777"); // true
validate.phoneNumber("((((("); // false (at least five digits are required)
validate.phoneNumber("555"); // false
```

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
        length: 19
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
        length: 14
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
```

`isValidPassword` rejects a password that contains a control character (U+0000–U+001F or U+007F). `password` (`validatePassword`) does not report control characters, so its result can show every check passing for a password that `isValidPassword` rejects. Check `hasControlCharacters` to tell the user why.

`setPasswordRequirements` replaces the default rules. Once it has been called, **only** the requirements you enable are enforced (the default upper case / lower case / number rule no longer applies) until `resetPasswordRequirements` is called. It returns `false`, and changes nothing, when `min` is not less than `max` or when the argument is not an object. Values of `min` and `max` below 1 are ignored.

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

A schema supports `type` (`"string"`, `"number"`, `"boolean"`, `"array"` or `"object"`), `required`, `minLength` / `maxLength` (strings), `minimum` / `maximum` (numbers), `minItems` / `maxItems` (arrays), `options` (allowed values), `pattern` (a regular expression string), `validate` (a custom function), `properties` (objects) and `arraySchema` (the schema for each array item).

- A value that is `undefined` (an omitted property) only fails `required`; every other check is skipped.
- `null` is a real value: it fails a `type` check, and a required `null` is reported as `"Value is required"`.
- Arrays do not satisfy `type: "object"`.

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

A schema is checked and copied when it is registered, so later changes to the object you passed in have no effect. Registering a malformed schema throws a `TypeError`. That covers an invalid `pattern`, an unknown `type`, a sub-schema that is not an object, or a circular reference. A `null` `properties` or `arraySchema` is treated as absent.

```js
validate.createSchemaValidator("bad", { type: "string", pattern: "(" }); // throws TypeError
validate.createSchemaValidator("bad", { type: "integer" }); // throws TypeError

// getSchema returns a copy of a registered schema (or undefined)
const schema = validate.getSchema("user");

// updateSchema replaces a registered schema; validators already created for
// that name look the schema up when they run, so they use the new one
validate.updateSchema("user", { ...schema, properties: { ...schema.properties, age: { type: "number", minimum: 18 } } });
validateUser({ name: "John", age: 16, email: "john@example.com" }); // { valid: false, errors: ["age: Minimum value is 18"] }
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Published under the [LGPL-2.1](LICENSE) license.

Published by **MDaemon Technologies, Ltd.**  
Simple Secure Email  
[https://www.mdaemon.com](https://www.mdaemon.com)
