# @mdaemon/validate, A Dependency Free input validation library
[ [@mdaemon/validate on npm](https://www.npmjs.com/package/@mdaemon/validate "npm") ]

The "validate" utility provides several validation methods, from domains to ipv6, and email to LDAP.

# Install #

	  $ npm install @mdaemon/validate --save  

# Node CommonJS #
```javascript
    const validate = require("@mdaemon/validate/dist/validate.cjs");
```

# Node Modules #

```javascript
    import validate from "@mdaemon/validate/dist/validate.mjs";  
```

# Web #
```HTML
    <script type="text/javascript" src="/path_to_modules/dist/validate.umd.js">
```

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
  const lower = validate.hasLowerCase("Test Password@1");
  console.log(lowerCase); // true

  const upper = validate.hasUpperCase("Test Password@1");
  console.log(upperCase); // true

  const number = validate.hasNumber("Test Password@1");
  console.log(number); // true

  const special = validate.hasSpecial("Test Password@1");
  console.log(special); // true

```
# License #

Published under the [LGPL-2.1 license](https://github.com/mdaemon-technologies/validate/blob/main/LICENSE "LGPL-2.1 License").
