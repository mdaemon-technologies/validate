const v = require("../dist/validate.cjs");
const { 
  validateDomain, 
  validateEmailAddress, 
  hasLowerCase, 
  hasNumber, 
  hasSpecial,
  hasUpperCase,
  validateHeader,
  validateHeaderName,
  validateHeaderValue,
  validateLdapDN,
  validateIPAddress,
  validateInt,
  validatePassword,
  validateWindowsFileName,
  validateWindowsPath
} = v;

const validate = v.default;

describe("validate has method domain", () => {
  it("is a function", () => {
    expect(typeof validate.domain).toBe("function");
  });

  it("validates domain names", () => {
    expect(validate.domain("tommy.com")).toBe(true);
    expect(validate.domain("tommy")).toBe(false);
    expect(validate.domain("test.tommy.com")).toBe(true);
    expect(validate.domain("test.tommy.co.uk")).toBe(true);
  });
  
  describe("validateDomain is an alias for validate.domain", () => {
    expect(typeof validateDomain).toBe("function");
    expect(validateDomain).toBe(validate.domain);
  });

});

describe("validate has method email", () => {
  it("is a function", () => {
    expect(typeof validate.email).toBe("function");
  });

  it("validates email addresses", () => {
    expect(validate.email("tommy.com")).toBe(false);
    expect(validate.email("@tommy.com")).toBe(false);
    expect(validate.email("t@tommy.com")).toBe(true);
    expect(validate.email("ted@tommy.co.uk")).toBe(true);
    expect(validate.email('"ted"@tommy.com')).toBe(true);
    expect(validate.email('"boss ted"@tommy.com')).toBe(true);
    expect(validate.email('boss @tommy.com')).toBe(false);
  });

  describe("validateEmailAddress is an alias for validate.email", () => {
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

  describe("hasLowerCase is an alias for validate.hasLowerCase", () => {
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

  describe("hasNumber is an alias for validate.hasNumber", () => {
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

  describe("hasSpecial is an alias for validate.hasSpecial", () => {
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

  describe("hasUpperCase is an alias for validate.hasUpperCase", () => {
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

  describe("validateHeader is an alias for validate.header", () => {
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

  describe("validateHeaderName is an alias for validate.headerName", () => {
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

  describe("validateHeaderValue is an alias for validate.headerValue", () => {
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
  
  describe("validateLdapDN is an alias for validate.ldapDN", () => {
    expect(typeof validateLdapDN).toBe("function");
    expect(validateLdapDN).toBe(validate.ldapDN);
  });
});

describe("validate has method ip", () => {
  it("is a function", () => {
    expect(typeof validate.ip).toBe("function");
  });

  it("validates IPv4 and IPv6 addresses", () => {
    expect(validate.ip("::1")).toBe(true);
    expect(validate.ip("1.1.1.1")).toBe(true);
    expect(validate.ip("1.1.1.1/16")).toBe(true);
    expect(validate.ip("fe80::500b:59e9:351:fbf3")).toBe(true);
  });

  describe("validateIPAddress is an alias for validate.ip", () => {
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

  describe("validateInt is an alias for validate.isInt", () => {
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

    expect(validate.password("thisisapassword1*")).toEqual({
      special: true,
      number: true,
      upper: false,
      lower: true,
      length: 17
    });

    expect(validate.password("THISISAPASSWORD1*")).toEqual({
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

  describe("validatePassword is an alias for validate.password", () => {
    expect(typeof validatePassword).toBe("function");
    expect(validatePassword).toBe(validate.password);
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
    expect(validate.windowsFileName("Thi$isavalidfilename")).toBe(true);
    "*|\\\":?/<>".split("").forEach(s => {
      expect(validate.windowsFileName(s)).toBe(false);
    });
  });

  describe("validateWindowsFileName is an alias for validate.windowsFileName", () => {
    expect(typeof validateWindowsFileName).toBe("function");
    expect(validateWindowsFileName).toBe(validate.windowsFileName);
  });
});

describe("validate has method windowsPath", () => {
  it("is a function", () => {
    expect(typeof validate.windowsPath).toBe("function");
  });
  
  it("validates windows file paths", () => {
    expect(validate.windowsPath("c:\\this\\is\\a\\valid\\path")).toBe(true);
    expect(validate.windowsPath("c:\\this\\isavalid.path")).toBe(true);
    expect(validate.windowsPath("\\\\this\\is\\also\\valid")).toBe(true);
    expect(validate.windowsPath("\\\\*\\this\\is\\valid?\\for\\wildcards", true)).toBe(true);
    expect(validate.windowsPath("d:\\this\\is\\not\\valid/")).toBe(false);
    expect(validate.windowsPath("d:\\this\\is\\not\\valid*")).toBe(false);
    expect(validate.windowsPath("d:\\this\\is\\not?\\valid")).toBe(false);
    expect(validate.windowsPath("ad:\\this\\is\\not?\\valid")).toBe(false);
    expect(validate.windowsPath("d*:\\this\\is\\not?\\valid", true)).toBe(false);
  });

  describe("validateWindowsPath is an alias for validate.windowsPath", () => {
    expect(typeof validateWindowsPath).toBe("function");
    expect(validateWindowsPath).toBe(validate.windowsPath);
  });
});