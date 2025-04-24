[![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Fvalidate%2Fmain%2Fpackage.json&query=%24.version&prefix=v&label=npm&color=blue)](https://www.npmjs.com/package/@mdaemon/validate) [![Static Badge](https://img.shields.io/badge/node-v14%2B-blue?style=flat&label=node&color=blue)](https://nodejs.org) [![install size](https://packagephobia.com/badge?p=@mdaemon/validate)](https://packagephobia.com/result?p=@mdaemon/validate) [![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Fvalidate%2Fmain%2Fpackage.json&query=%24.license&prefix=v&label=license&color=green)](https://github.com/mdaemon-technologies/validate/blob/main/LICENSE) [![Node.js CI](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml/badge.svg)](https://github.com/mdaemon-technologies/validate/actions/workflows/node.js.yml)

# @mdaemon/validate, A Dependency Free input validation library
[ [@mdaemon/validate on npm](https://www.npmjs.com/package/@mdaemon/validate "npm") ]

The "validate" utility provides several validation methods, from domains to ipv6, and email to LDAP, and schema validation methods.

> **Note:** As of version 3.0.0, this library has been converted to TypeScript for improved type safety and developer experience.

# Install #

	  $ npm install @mdaemon/validate --save  

# Import / Require #

## Node ESM (Recommended)
```javascript
// Import the default export
import validate from "@mdaemon/validate";

// Import specific functions
import { validateDomain, validateEmailAddress } from "@mdaemon/validate";
```

## Node CommonJS
```javascript
// Require the default export
const validate = require("@mdaemon/validate/dist/validate.cjs");

// Destructuring specific functions
const { validateDomain, validateEmailAddress } = require("@mdaemon/validate/dist/validate.cjs");
```

## TypeScript
```typescript
// Import with full TypeScript support
import validate from "@mdaemon/validate";
import { validateDomain, ISchema, ISchemaValidationResult } from "@mdaemon/validate";
```

## Browser/Web
```html
<script type="text/javascript" src="/path_to_modules/@mdaemon/validate/dist/validate.umd.js"></script>
<script>
  // Access via global variable
  const isValid = validate.domain("example.com");
</script>
```

# TypeScript Support

This library includes full TypeScript definitions and interfaces:

- `ISchema` - Interface for defining validation schemas
- `ISchemaValidationResult` - Interface for validation results
- Strong typing for all validation methods and parameters

### Validate domain syntax ###

```javascript
    let validDomain = validate.domain("mdaemon.com");
    console.log(validDomain); // true

    validDomain = validate.domain("mdaemon");
    console.log(validDomain); // false

    // use wild cards *
    validDomain = validate.domain("mdaemon.*", true);
    console.log(validDomain); // true  
```

### Validate email address syntax ###

```javascript
    let validEmail = validate.email("tommy@mdaemon.com");
    console.log(validEmail); // true

    validEmail = validate.email("tommy.com");
    console.log(validEmail); // false

    // use wild cards * or ?
    validEmail = validate.email("*@mdaemon???", true);
    console.log(validEmail); // true
```

### Validate ipv4 and ipv6 address syntax ###

```javascript
    let validIP = validate.ip("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    console.log(validIP); // true

    validIP = validate.ip("::");
    console.log(validIP); // true

    validIP = validate.ip("10");
    console.log(validIP); // false

    // use wild cards * or ? or #
    validIP = validate.ip("10.*.*.###", true); 
    console.log(validIP); // true
```

### Validate LDAP DN syntax ###

```javascript
    let validDN = validate.ldapDN("CN=test,OU=test,DC=test");
    console.log(validDN); // true
```

### Validate windows file name ###

```javascript
    let validFileName = validate.windowsFileName("test.txt");
    console.log(validFileName); // true

    validFileName = validate.windowsFileName("~test.txt");
    console.log(validFileName); // false
```

### Validate windows path ###

```javascript
    let validPath = validate.windowsPath("C:\\test\\this\\path");
    console.log(validPath); // true

    validPath = validate.windowsPath("C:\\test\n");
    console.log(validPath); // false

    // user wild cards
    validPath = validate.windowsPath("C:\\*", true);
    console.log(validPath); // true
```

### Validate value is an int as opposed to a float ###

```javascript
    let validInt = validate.int("1");
    console.log(validInt); // true

    validInt = validate.int("1.1");
    console.log(validInt); // false
```

### Validate HTTP headers ###

```javascript
    let validHeaderName = validate.headerName("X-Test-Name");
    console.log(validHeaderName); // true

    validHeaderName = validate.headerName("X=Test=Name");
    console.log(validHeaderName); // false

    let validHeaderValue = validate.headerValue("1");
    console.log(validHeaderValue); // true

    validHeaderValue = validate.headerValue("default-src 'self' example.com *.example.com");
    console.log(validHeaderValue); // true

    validHeaderValue = validate.headerValue("default-src 'self' \n");
    console.log(validHeaderValue); // false

    let validHeader = validate.header("Content-Security-Policy: default-src 'self'");
    console.log(validHeader); // true

    validHeader = validate.header("X-Frame-Options");
    console.log(validHeader); // false
```

### Validate password requirements ###

```javascript
    // do not require special characters
    let validPassword = validate.password("Test this Password1");
    console.log(validPassword); 
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
   validPassword = validate.password("test this one1", true);
   console.log(validPassword);
   /*
        {
            special: false,
            lower: true,
            upper: false,
            number: true,
            length: 13
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

  // added for v1.2.0
  validate.isValidPassword("TestPassword1"); // true

  // include bRequireSpecial
  validate.isValidPassword("TestPassword1", true); // false

  // include min and max length of the password, or just min length
  validate.isValidPassword("TestPassword1*", true, 4, 20); // true
  
  // returns false if min >= max
  // numbers less than 1 min and max are ignored
  validate.setPasswordRequirements({ 
    upper: true, 
    lower: true, 
    number: false, 
    special: true, 
    min: 6, 
    max: 16 
  }); // true

  validate.isValidPassword("TestPassword*"); // true
  
  validate.setPasswordRequirements({ upper: false }); // true

  // you can override the requirements for special, min length, and max length
  validate.isValidPassword("testpassword", false); // true
  
  validate.resetPasswordRequirements();

  validate.isValidPassword("testpassword*"); // false
```

### Validate Custom Schema ###

```javascript
  // Schema validation examples
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
    const user = {
      name: "John",
      age: 30,
      email: "john@example.com"
    };
    validateUser(user); // { valid: true, errors: [] }
  
    // Invalid object example
    const invalidUser = {
      name: "J", // too short
      age: 150, // exceeds maximum
      email: undefined // missing required field
    };
    validateUser(invalidUser); 
    /* Returns:
    {
      valid: false,
      errors: [
        { field: "name", errors: ["Minimum length is 2"] },
        { field: "age", errors: ["Maximum value is 120"] },
        { field: "email", errors: ["Value is required"] }
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
          completed: { type: "boolean", required: true }
          type: { type: "string", required: true, options: ["business", "personal"] }
        }
      },
      minItems: 1,
      maxItems: 10
    };
  
    const validateTodoList = validate.createSchemaValidator("todoList", todoListSchema);
  
    const todoList = [{
      id: "1",
      task: "Buy groceries",
      completed: false,
      type: "personal"
    }];
    validateTodoList(todoList); // { valid: true, errors: [] }

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

    const validUsername = { username: "john_doe123" };
    validateUsername(validUsername); // { valid: true, errors: [] }

    const invalidUsername = { username: "j@hn!" };
    validateUsername(invalidUsername); 
    /* Returns:
    {
      valid: false, 
      errors: [
        { field: "username", errors: ["Value does not match pattern ^[a-zA-Z0-9_]{3,16}$"] }
      ]
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
            return value > 0 && Number.isInteger(value * 100); // Must be positive and max 2 decimal places
          }
        }
      }
    };

    const validatePrice = validate.createSchemaValidator("price", priceSchema);

    const validPrice = { price: 19.99 };
    validatePrice(validPrice); // { valid: true, errors: [] }

    const invalidPrice = { price: 19.999 };
    validatePrice(invalidPrice);
    /* Returns:
    {
      valid: false,
      errors: [
        { field: "price", errors: ["Custom validation failed"] }
      ]
    }
    */
    
  

```
# License #

Published under the [LGPL-2.1 license](https://github.com/mdaemon-technologies/validate/blob/main/LICENSE "LGPL-2.1 License").

Published by<br/> 
<b>MDaemon Technologies, Ltd.<br/>
Simple Secure Email</b><br/>
[https://www.mdaemon.com](https://www.mdaemon.com)