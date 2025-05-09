import validate from "../src/validate";
import {
  validateDomain, 
  validateEmailAddress, 
  hasControlCharacters,
  hasLowerCase, 
  hasNumber, 
  hasSpecial,
  hasUpperCase,
  isValidPassword,
  resetPasswordRequirements,
  setPasswordRequirements,
  validateHeader,
  validateHeaderName,
  validateHeaderValue,
  validateLdapDN,
  validateIPAddress,
  validateInt,
  validatePassword,
  validatePhoneNumber,
  validateWindowsFileName,
  validateWindowsPath,
  createSchemaValidator,
  getSchema,
  ISchema
} from "../src/validate";

describe("validate has method domain", () => {
  it("is a function", () => {
    expect(typeof validate.domain).toBe("function");
  });

  it("validates domain names", () => {
    expect(validate.domain("tommy.com", false)).toBe(true);
    expect(validate.domain("tommy", false)).toBe(false);
    expect(validate.domain("test.tommy.com", false)).toBe(true);
    expect(validate.domain("test.tommy.co.uk", false)).toBe(true);
  });
  
  it("validateDomain is an alias for validate.domain", () => {
    expect(typeof validateDomain).toBe("function");
    expect(validateDomain).toBe(validate.domain);
  });
});

describe("validate has method email", () => {
  it("is a function", () => {
    expect(typeof validate.email).toBe("function");
  });

  it("validates email addresses", () => {
    expect(validate.email("tommy.com", false)).toBe(false);
    expect(validate.email("@tommy.com", false)).toBe(false);
    expect(validate.email("t@tommy.com", false)).toBe(true);
    expect(validate.email("ted@tommy.co.uk", false)).toBe(true);
    expect(validate.email('"ted"@tommy.com', false)).toBe(true);
    expect(validate.email('"boss ted"@tommy.com', false)).toBe(true);
    expect(validate.email('boss @tommy.com', false)).toBe(false);
  });

  it("validateEmailAddress is an alias for validate.email", () => {
    expect(typeof validateEmailAddress).toBe("function");
    expect(validateEmailAddress).toBe(validate.email);
  });
});

describe("validate has method hasLowerCase", () => {
  it("is a function", () => {
    expect(typeof validate.hasLowerCase).toBe("function");
  });

  it("validates that a string has a lower case letter", () => {
    expect(validate.hasLowerCase("TEST")).toBe(false);
    expect(validate.hasLowerCase("TESt")).toBe(true);
    expect(validate.hasLowerCase("SOMETHING_THAT_HAS_THINGS_IN_IT1234567890*&^%$#@!()-+\\|}{]['\";:,./?><`~")).toBe(false);
    expect(validate.hasLowerCase("Testing")).toBe(true);
  });

  it("hasLowerCase is an alias for validate.hasLowerCase", () => {
    expect(typeof hasLowerCase).toBe("function");
    expect(hasLowerCase).toBe(validate.hasLowerCase);
  });
});

describe("validate has method hasNumber", () => {
  it("is a function", () => {
    expect(typeof validate.hasNumber).toBe("function");
  });

  it("validates that a string has a number", () => {
    expect(validate.hasNumber("TEST")).toBe(false);
    expect(validate.hasNumber("1")).toBe(true);
    expect(validate.hasNumber("SOMETHING_THAT_HAS_THINGS_IN_ITsomthingelse*&^%$#@!()-+\\|}{]['\";:,./?><`~")).toBe(false);
    expect(validate.hasNumber("SOMETHING_THAT_HAS_THINGS_IN_IT0*&^%$#@!()-+\\|}{]['\";:,./?><`~")).toBe(true);
  });

  it("hasNumber is an alias for validate.hasNumber", () => {
    expect(typeof hasNumber).toBe("function");
    expect(hasNumber).toBe(validate.hasNumber);
  });
});

describe("validate has method hasSpecial", () => {
  it("is a function", () => {
    expect(typeof validate.hasSpecial).toBe("function");
  });

  it("validates that a string has a special character", () => {
    expect(validate.hasSpecial("test")).toBe(false);
    expect(validate.hasSpecial("TEST")).toBe(false);
    "/*-+,.<>?';:\"\|][{}=_)(&^%$#@!~`".split("").forEach(s => {
      expect(validate.hasSpecial(s)).toBe(true);
    });
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("").forEach(s => {
      expect(validate.hasSpecial(s)).toBe(false);
    });
  });

  it("does not validate a space or a 'white-space character' as a special character", () => {
    expect(validate.hasSpecial(" \n\t\r")).toBe(false);
  });

  it("hasSpecial is an alias for validate.hasSpecial", () => {
    expect(typeof hasSpecial).toBe("function");
    expect(hasSpecial).toBe(validate.hasSpecial);
  });
});

describe("validate has method hasUpperCase", () => {
  it("is a function", () => {
    expect(typeof validate.hasUpperCase).toBe("function");
  });

  it("validates that a string has an upper case character", () => {
    expect(validate.hasUpperCase("test")).toBe(false);
    expect(validate.hasUpperCase("tesT")).toBe(true);
    expect(validate.hasUpperCase("Test")).toBe(true);
    expect(validate.hasUpperCase("tEst")).toBe(true);
    expect(validate.hasUpperCase("something_has_a_thing_in_it1234567890*&^%$#@!()-+\\|}{]['\";:,./?><`~")).toBe(false);
    expect(validate.hasUpperCase("tESTING")).toBe(true);
  });

  it("hasUpperCase is an alias for validate.hasUpperCase", () => {
    expect(typeof hasUpperCase).toBe("function");
    expect(hasUpperCase).toBe(validate.hasUpperCase);
  });
});

describe("validate has method header", () => {
  it("is a function", () => {
    expect(typeof validate.header).toBe("function");
  });

  it("validates an HTTP header name and value", () => {
    expect(validate.header("X-Compose test")).toBe(false);
    expect(validate.header("X-Compost: test")).toBe(true);
    expect(validate.header("test")).toBe(false);
    expect(validate.header("test: test")).toBe(true);
    expect(validate.header("accept-ranges: bytes")).toBe(true);
    expect(validate.header("age: 30657")).toBe(true);
    expect(validate.header("cache-control: public, max-age=0, must-revalidate")).toBe(true);
    expect(validate.header("content-encoding: br")).toBe(true);
    expect(validate.header("content-length: 17949")).toBe(true);
    expect(validate.header("content-type: application/javascript; charset=UTF-8")).toBe(true);
    expect(validate.header("date: Thu, 19 Jan 2023 09:30:32 GMT")).toBe(true);
    expect(validate.header("etag: \"15e8c1bf796aff89c97d919b4157868f-ssl\"")).toBe(true);
    expect(validate.header("server: Netlify")).toBe(true);
    expect(validate.header("strict-transport-security: max-age=31536000")).toBe(true);
    expect(validate.header("vary: Accept-Encoding")).toBe(true);
    expect(validate.header("x-nf-request-id: 01GQ5K2RRH60BMD8D44745Y809")).toBe(true);
  });

  it("validateHeader is an alias for validate.header", () => {
    expect(typeof validateHeader).toBe("function");
    expect(validateHeader).toBe(validate.header);
  });
});

describe("validate has method headerName", () => {
  it("is a function", () => {
    expect(typeof validate.headerName).toBe("function");
  });
  
  it("validates the header name of an HTTP header", () => {
    expect(validate.headerName("test:")).toBe(false);
    expect(validate.headerName(":test")).toBe(false);
    expect(validate.headerName("test")).toBe(true);
    expect(validate.headerName("test-t")).toBe(true);
    expect(validate.headerName("test-")).toBe(false);
    expect(validate.headerName("test*test")).toBe(false);
  });

  it("validateHeaderName is an alias for validate.headerName", () => {
    expect(typeof validateHeaderName).toBe("function");
    expect(validateHeaderName).toBe(validate.headerName);
  });
});

describe("validate has method headerValue", () => {
  it("is a function", () => {
    expect(typeof validate.headerValue).toBe("function");
  });

  it("validates the header value of an HTTP header", () => {
    expect(validate.headerValue("this is a value")).toBe(true);
    expect(validate.headerValue("this:is:also:a:value")).toBe(true);
    expect(validate.headerValue("this_value_works")).toBe(true);
    expect(validate.headerValue("this\nwillnotwork")).toBe(false);
    expect(validate.headerValue("this; test=nine; is=more common~`!@#$%^&*()-+={}[]|\\;:'\"<>,.?/;")).toBe(true);
  });

  it("validateHeaderValue is an alias for validate.headerValue", () => {
    expect(typeof validateHeaderValue).toBe("function");
    expect(validateHeaderValue).toBe(validate.headerValue);
  });
});

describe("validate has method ldapDN", () => {
  it("is a function", () => {
    expect(typeof validate.ldapDN).toBe("function");
  });

  it("validates LDAP distinguished names", () => {
    expect(validate.ldapDN("test")).toBe(false);
    expect(validate.ldapDN("uid=john")).toBe(true);
    expect(validate.ldapDN("uid=john,ou=Group,dc=mdaemon,dc=com")).toBe(true);
    expect(validate.ldapDN("uid  = john , ou = Group , dc = mdaemon , dc = com")).toBe(true);
    expect(validate.ldapDN("0.9.2342.19200300.100.1.1=johnboy")).toBe(true);
    expect(validate.ldapDN("CN=john.doe")).toBe(true);
    expect(validate.ldapDN("cn=john.doe")).toBe(true);
    expect(validate.ldapDN("cn =john.doe")).toBe(true);
    expect(validate.ldapDN("cn = john.doe")).toBe(true);
    expect(validate.ldapDN("cn=john.doe+email=john@jedi.mail")).toBe(true);
    expect(validate.ldapDN("2.5.4.3=john.doe")).toBe(true);
    expect(validate.ldapDN("OU=test")).toBe(true);
    expect(validate.ldapDN("OU=Group")).toBe(true);
    expect(validate.ldapDN("ou=test")).toBe(true);
    expect(validate.ldapDN("2.5.4.11=test")).toBe(true);
    expect(validate.ldapDN("2.5.4.3=john.doe")).toBe(true);
    expect(validate.ldapDN("0.9.2342.19200300.100.1.25=example")).toBe(true);
  });
  
  it("validateLdapDN is an alias for validate.ldapDN", () => {
    expect(typeof validateLdapDN).toBe("function");
    expect(validateLdapDN).toBe(validate.ldapDN);
  });
});

describe("validate has method ip", () => {
  it("is a function", () => {
    expect(typeof validate.ip).toBe("function");
  });

  it("validates IPv4 and IPv6 addresses", () => {
    expect(validate.ip("::1", false)).toBe(true);
    expect(validate.ip("1.1.1.1", false)).toBe(true);
    expect(validate.ip("1.1.1.1/16", false)).toBe(true);
    expect(validate.ip("fe80::500b:59e9:351:fbf3", false)).toBe(true);
    expect(validate.ip("fe80::500b:59e9:351:fbf3/29", false)).toBe(true);
  });

  it("validateIPAddress is an alias for validate.ip", () => {
    expect(typeof validateIPAddress).toBe("function");
    expect(validateIPAddress).toBe(validate.ip);
  });
});

describe("validate has method isInt", () => {
  it("is a function", () => {
    expect(typeof validate.isInt).toBe("function");
  });

  it("validates that a string value is an integer", () => {
    expect(validate.isInt("1")).toBe(true);
    expect(validate.isInt("1.1")).toBe(false);
  });

  it("validateInt is an alias for validate.isInt", () => {
    expect(typeof validateInt).toBe("function");
    expect(validateInt).toBe(validate.isInt);
  });
});

describe("validate has method password", () => {
  it("is a function", () => {
    expect(typeof validate.password).toBe("function");
  });
  
  it("returns an object with boolean properties special, number, upper, lower, and number property length", () => {
    expect(validate.password("ThisIsAPassword1*", true)).toEqual({
      special: true,
      number: true,
      upper: true,
      lower: true,
      length: 17
    });

    expect(validate.password("thisisapassword1*", true)).toEqual({
      special: true,
      number: true,
      upper: false,
      lower: true,
      length: 17
    });

    expect(validate.password("THISISAPASSWORD1*", true)).toEqual({
      special: true,
      number: true,
      upper: true,
      lower: false,
      length: 17
    });

    expect(validate.password("1561321", true)).toEqual({
      special: false,
      number: true,
      upper: false,
      lower: false,
      length: 7
    });

    expect(validate.password("ThisIsAPassword*", true)).toEqual({
      special: true,
      number: false,
      upper: true,
      lower: true,
      length: 16
    });
  });

  it("returns additional boolean properties min and max when nMinLength or nMaxLength are included as parameters", () => {
    expect(validate.password("ThisIsAPassword*", true, 5, 20)).toEqual({
      special: true,
      number: false,
      upper: true,
      lower: true,
      length: 16,
      min: true,
      max: true
    });

    expect(validate.password("ThisIsAPassword*", true, 17, 20)).toEqual({
      special: true,
      number: false,
      upper: true,
      lower: true,
      length: 16,
      min: false,
      max: true
    });

    expect(validate.password("ThisIsAPassword*", true, 10, 15)).toEqual({
      special: true,
      number: false,
      upper: true,
      lower: true,
      length: 16,
      min: true,
      max: false
    });
  });

  it("validatePassword is an alias for validate.password", () => {
    expect(typeof validatePassword).toBe("function");
    expect(validatePassword).toBe(validate.password);
  });
});

describe("validate has method isValidPassword", () => {
  it("is a function", () => {
    expect(typeof validate.isValidPassword).toBe("function");
  });

  it("takes up to four arguments (password, bRequireSpecial, nMinLength, nMaxLength) and returns true for valid passwords", () => {
    expect(validate.isValidPassword("ThisIsAPassword1*", true, 8, 20)).toBe(true);
    expect(validate.isValidPassword("ThisPasswordIsValid1", false, 8, 20)).toBe(true);
  });

  it("returns false for invalid passwords", () => {
    expect(validate.isValidPassword("thisisapassword1*", true, 8, 20)).toBe(false);
    expect(validate.isValidPassword("THISISAPASSWORD1*", true, 8, 20)).toBe(false);
    expect(validate.isValidPassword("1561321", true, 8, 20)).toBe(false);
    expect(validate.isValidPassword("ThisIsAPassword*", true, 8, 20)).toBe(false);
  });

  it("isValidPassword is an alias for validate.isValidPassword", () => {
    expect(typeof isValidPassword).toBe("function");
    expect(isValidPassword).toBe(validate.isValidPassword);
  });
});

describe("validate has method setPasswordRequirements", () => {
  it("is a function", () => {
    expect(typeof validate.setPasswordRequirements).toBe("function");
  });

  it("accepts an object of password requirements { upper, lower, number, special, min, max }", () => {
    expect(validate.setPasswordRequirements({ upper: true, lower: true, number: false, special: false, min: 4, max: 20 })).toBe(true);

    expect(isValidPassword("ThisIsValid", false, 0, 0)).toBe(true);

    validate.setPasswordRequirements({ upper: false, lower: false, number: true, special: false });
    
    expect(isValidPassword("1040", false, 0, 0)).toBe(true);

    validate.setPasswordRequirements({ special: true, number: false });

    expect(isValidPassword("&*^%", true, 0, 0)).toBe(true);

    resetPasswordRequirements();
  });

  it("can be overridden by the bRequireSpecial, nMinLength, and nMaxLength parameters of the validate methods", () => {
    setPasswordRequirements({ upper: true, lower: true, number: true, special: false });

    expect(isValidPassword("ThisIsNotValid1", true, 0, 0)).toBe(false);
    expect(isValidPassword("ThisIsNotValid1", false, 20, 30)).toBe(false);
    expect(isValidPassword("ThisIsValid1*", true, 8, 20)).toBe(true);

    resetPasswordRequirements();
  });

  it("setPasswordRequirements is an alias for validate.setPasswordRequirements", () => {
    expect(typeof setPasswordRequirements).toBe("function");
    expect(setPasswordRequirements).toBe(validate.setPasswordRequirements);
  });
});

describe("validate has method resetPasswordRequirements", () => {
  it("is a function", () => {
    expect(typeof validate.resetPasswordRequirements).toBe("function");
  });

  it("resets the password requirements options to the default behavior", () => {
    setPasswordRequirements({ upper: false, lower: false, number: false, special: true });

    expect(isValidPassword("*****", true)).toBe(true);

    resetPasswordRequirements();

    // default requirements are upper, lower, and number
    expect(isValidPassword("*****")).toBe(false);
    expect(isValidPassword("TEST1")).toBe(false);
    expect(isValidPassword("test1")).toBe(false);
    expect(isValidPassword("Test1")).toBe(true);
  });
});

describe("validate has method phoneNumber", () => {
  it("is a function", () => {
    expect(typeof validate.phoneNumber).toBe("function");
  });

  it("validates a phone number", () => {
    expect(validate.phoneNumber("+18325267777")).toBe(true);
    expect(validate.phoneNumber("1 (832) 526-7777")).toBe(true);
    expect(validate.phoneNumber("+1-832-526-7777")).toBe(true);
    expect(validate.phoneNumber("+12 (832) 526-7777")).toBe(true);
    expect(validate.phoneNumber("+13 832 526 7777")).toBe(true);
    expect(validate.phoneNumber("+14 832-526-7777")).toBe(true);
  });

  it("validatePhoneNumber is an alias for validate.phoneNumber", () => {
    expect(typeof validatePhoneNumber).toBe("function");
    expect(validatePhoneNumber).toBe(validate.phoneNumber);
  });
});

describe("validate has method windowsFileName", () => {
  it("is a function", () => {
    expect(typeof validate.windowsFileName).toBe("function");
  });
  
  it("validates a windows file name", () => {
    expect(validate.windowsFileName("This is a filename.txt")).toBe(true);
    expect(validate.windowsFileName("This/isnotavalidfilename.txt")).toBe(false);
    expect(validate.windowsFileName("Thi$isavalidfilename")).toBe(true);
    "*|\\\":?/<>".split("").forEach(s => {
      expect(validate.windowsFileName(s)).toBe(false);
    });
  });

  it("validateWindowsFileName is an alias for validate.windowsFileName", () => {
    expect(typeof validateWindowsFileName).toBe("function");
    expect(validateWindowsFileName).toBe(validate.windowsFileName);
  });
});

describe("validate has method windowsPath", () => {
  it("is a function", () => {
    expect(typeof validate.windowsPath).toBe("function");
  });
  
  it("validates windows file paths", () => {
    expect(validate.windowsPath("c:\\this\\is\\a\\valid\\path", false)).toBe(true);
    expect(validate.windowsPath("c:\\this\\isavalid.path", false)).toBe(true);
    expect(validate.windowsPath("\\\\this\\is\\also\\valid", false)).toBe(true);
    expect(validate.windowsPath("\\\\*\\this\\is\\valid?\\for\\wildcards", true)).toBe(true);
    expect(validate.windowsPath("d:\\this\\is\\not\\valid/", false)).toBe(false);
    expect(validate.windowsPath("d:\\this\\is\\not\\valid*", false)).toBe(false);
    expect(validate.windowsPath("d:\\this\\is\\not?\\valid", false)).toBe(false);
    expect(validate.windowsPath("ad:\\this\\is\\not?\\valid", false)).toBe(false);
    expect(validate.windowsPath("d*:\\this\\is\\not?\\valid", true)).toBe(false);
  });

  it("validateWindowsPath is an alias for validate.windowsPath", () => {
    expect(typeof validateWindowsPath).toBe("function");
    expect(validateWindowsPath).toBe(validate.windowsPath);
  });
});

describe("validate has method hasControlCharacters", () => {
  it("is a function", () => {
    expect(typeof validate.hasControlCharacters).toBe("function");
  });

  it("confirms a string has control characters", () => {
    expect(validate.hasControlCharacters("\t")).toBe(true);
    expect(validate.hasControlCharacters("\b")).toBe(true);
    expect(validate.hasControlCharacters("\f")).toBe(true);
    expect(validate.hasControlCharacters("\n")).toBe(true);
    expect(validate.hasControlCharacters("\r")).toBe(true);
    expect(validate.hasControlCharacters("\v")).toBe(true);
    expect(validate.hasControlCharacters("\u0009")).toBe(true);
    expect(validate.hasControlCharacters("\u0008")).toBe(true);
    expect(validate.hasControlCharacters("\u000c")).toBe(true);
    expect(validate.hasControlCharacters("\u000a")).toBe(true);
    expect(validate.hasControlCharacters("\u000d")).toBe(true);
    expect(validate.hasControlCharacters("\u000b")).toBe(true);
  });

  it("hasControlCharacters is an alias for validate.hasControlCharacters", () => {
    expect(typeof hasControlCharacters).toBe("function");
    expect(hasControlCharacters).toBe(validate.hasControlCharacters);
  });
});

describe("validate schema functionality", () => {
  it("validates object against simple schema", () => {
    const validator = createSchemaValidator("user", {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        age: { type: "number" }
      }
    });

    const validResult = validator({
      name: "John",
      age: 30
    });
    
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidResult = validator({
      age: "30"
    });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it("validates string length constraints", () => {
    const validator = createSchemaValidator("product", {
      type: "object",
      properties: {
        code: { type: "string", minLength: 3, maxLength: 10 }
      }
    });

    expect(validator({ code: "abc" }).valid).toBe(true);
    expect(validator({ code: "ab" }).valid).toBe(false);
    expect(validator({ code: "12345678901" }).valid).toBe(false);
  });

  it("validates number range constraints", () => {
    const validator = createSchemaValidator("score", {
      type: "object",
      properties: {
        value: { type: "number", minimum: 0, maximum: 100 }
      }
    });

    expect(validator({ value: 50 }).valid).toBe(true);
    expect(validator({ value: -1 }).valid).toBe(false);
    expect(validator({ value: 101 }).valid).toBe(false);
  });

  it("validates boolean values", () => {
    const validator = createSchemaValidator("settings", {
      type: "object",
      properties: {
        active: { type: "boolean", required: true }
      }
    });

    expect(validator({ active: true }).valid).toBe(true);
    expect(validator({ active: false }).valid).toBe(true);
    expect(validator({ active: "true" }).valid).toBe(false);
    expect(validator({}).valid).toBe(false);
  });

  it("validates array type and length constraints", () => {
    const validator = createSchemaValidator("list", {
      type: "object", 
      properties: { 
        items: { 
          type: "array", 
          arraySchema: { type: "number" }, 
          minItems: 1, 
          maxItems: 3 
        } 
      }
    });

    expect(validator({ items: [1, 2] }).valid).toBe(true);
    expect(validator({ items: [] }).valid).toBe(false);
    expect(validator({ items: [1, 2, 3, 4] }).valid).toBe(false);
    expect(validator({ items: "not-array" }).valid).toBe(false);
  });

  it("validates nested object schemas", () => {
    const validator = createSchemaValidator("nested", {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string", required: true },
            address: {
              type: "object",
              properties: {
                street: { type: "string", required: true },
                city: { type: "string", required: true }
              }
            }
          }
        }
      }
    });

    expect(validator({
      user: {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Boston"
        }
      }
    }).valid).toBe(true);

    expect(validator({
      user: {
        name: "John",
        address: {
          street: "123 Main St"
        }
      }
    }).valid).toBe(false);
  });

  it("handles multiple field validations", () => {
    const validator = createSchemaValidator("complex", {
      type: "object",
      properties: {
        id: { type: "string", required: true },
        count: { type: "number", minimum: 0 },
        enabled: { type: "boolean" }
      }
    });

    const result = validator({
      id: 123,
      count: -1,
      enabled: "false"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validates options schema correctly", () => {
    const validator = createSchemaValidator("options", {
      type: "array",
      arraySchema: {
        type: "object",
        properties: {
          label: { type: "string", required: true, options: ["Option 1", "Option 2"] },
          value: { type: "string", required: true }
        }
      }
    });

    const result = validator([
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" }
    ]);
    
    expect(result.valid).toBe(true);

    expect(validator([
      { label: "Option 1" },
      { value: "opt2" }
    ]).valid).toBe(false);

    expect(validator([
      { label: 123, value: "opt1" },
      { label: "Option 2", value: true }
    ]).valid).toBe(false);
  });

  it("validates pattern matching correctly", () => {
    const validator = createSchemaValidator("pattern", {
      type: "object",
      properties: {
        zipCode: { type: "string", pattern: "^\\d{5}(-\\d{4})?$" },
        phone: { type: "string", pattern: "^\\+?[0-9-]{10,}$" }
      }
    });

    expect(validator({
      zipCode: "12345",
      phone: "123-456-7890"
    }).valid).toBe(true);

    expect(validator({
      zipCode: "1234",
      phone: "abc-def-ghij"
    }).valid).toBe(false);

    expect(validator({
      zipCode: "12345-6789",
      phone: "+1-234-567-8900"
    }).valid).toBe(true);
  });

  it("ensures original schema cannot be modified through getSchema", () => {
    const originalSchema = {
      type: "object",
      properties: {
        name: { type: "string", required: true }
      }
    } as ISchema;

    createSchemaValidator("immutableTest", originalSchema);
    const retrievedSchema = getSchema("immutableTest");
    
    if (retrievedSchema && retrievedSchema.properties) {
      // Attempt to modify the retrieved schema
      retrievedSchema.properties.name.required = false;
      // Use type assertion to add a new property safely
      (retrievedSchema.properties as any).newField = { type: "string" };
    }
    
    // Verify original schema remains unchanged
    expect(originalSchema.properties?.name.required).toBe(true);
    // Check using safe property access that newField doesn't exist on original
    expect((originalSchema.properties as any)?.newField).toBeUndefined();
    
    // Verify validation still works with original rules
    const validator = createSchemaValidator("immutableTest", originalSchema);
    expect(validator({ name: "test" }).valid).toBe(true);
    expect(validator({}).valid).toBe(false);
  });

  it("validates using custom validation functions", () => {
    const validator = createSchemaValidator("custom", {
      type: "object",
      properties: {
        even: { 
          type: "number",
          validate: function(value) { return value % 2 === 0; }
        },
        domain: {
          type: "string",
          validate: function(value) { return validateDomain(value, false); }
        }
      }
    });

    expect(validator({
      even: 2,
      domain: "example.com"
    }).valid).toBe(true);

    expect(validator({
      even: 3,
      domain: "not-a-url"
    }).valid).toBe(false);

    expect(validator({
      even: 4,
      domain: "www.test.com"
    }).valid).toBe(true);
  });

  it("validates a complex pattern with arrays of objects", () => {
    const validator = createSchemaValidator("complexArray", {
      type: "object",
      properties: {
        id: { 
          type: "string", 
          required: true, 
          validate: function(value) { return typeof value === "string" && value.length >= 3; }
        },
        ival: { type: "number", required: true },
        items: {
          type: "array",
          arraySchema: {
            type: "object",
            properties: {
              name: { type: "string", required: true },
              tags: {
                type: "array",
                arraySchema: { type: "string" },
                minItems: 1
              }
            }
          }
        }
      }
    });

    expect(validator({
      id: "123",
      ival: 456,
      items: [
        { name: "Item 1", tags: ["tag1", "tag2"] },
        { name: "Item 2", tags: ["tag3"] }
      ]
    }).valid).toBe(true);

    expect(validator({
      items: [
        { name: "Item 1", tags: [] },
        { name: "Item 2" }
      ]
    }).valid).toBe(false);
  });
});
