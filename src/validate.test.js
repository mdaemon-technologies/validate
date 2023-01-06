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

  it("is a function", () => {
    expect(typeof validateDomain).toBe("function");
  });

});

describe("validate has method email", () => {
  it("is a function", () => {
    expect(typeof validate.email).toBe("function");
  });

  it("is a function", () => {
    expect(typeof validateEmailAddress).toBe("function");
  });
  
});

describe("validate has method hasLowerCase", () => {
  it("is a function", () => {
    expect(typeof validate.hasLowerCase).toBe("function");
  });

  it("is a function", () => {
    expect(typeof hasLowerCase).toBe("function");
  });
  
});

describe("validate has method hasNumber", () => {
  it("is a function", () => {
    expect(typeof validate.hasNumber).toBe("function");
  });

  it("is a function", () => {
    expect(typeof hasNumber).toBe("function");
  });
  
});

describe("validate has method hasSpecial", () => {
  it("is a function", () => {
    expect(typeof validate.hasSpecial).toBe("function");
  });

  it("is a function", () => {
    expect(typeof hasSpecial).toBe("function");
  });
  
});

describe("validate has method hasUpperCase", () => {
  it("is a function", () => {
    expect(typeof validate.hasUpperCase).toBe("function");
  });

  it("is a function", () => {
    expect(typeof hasUpperCase).toBe("function");
  });
  
});

describe("validate has method header", () => {
  it("is a function", () => {
    expect(typeof validate.header).toBe("function");
  });

  it("is a function", () => {
    expect(typeof validateHeader).toBe("function");
  });
  
});

describe("validate has method headerName", () => {
  it("is a function", () => {
    expect(typeof validate.headerName).toBe("function");
  });
  
  it("is a function", () => {
    expect(typeof validateHeaderName).toBe("function");
  });
});

describe("validate has method headerValue", () => {
  it("is a function", () => {
    expect(typeof validate.headerValue).toBe("function");
  });
  
  it("is a function", () => {
    expect(typeof validateHeaderValue).toBe("function");
  });
});

describe("validate has method ldapDN", () => {
  it("is a function", () => {
    expect(typeof validate.ldapDN).toBe("function");
  });

  it("is a function", () => {
    expect(typeof validateLdapDN).toBe("function");
  });
  
});

describe("validate has method ip", () => {
  it("is a function", () => {
    expect(typeof validate.ip).toBe("function");
  });

  it("is a function", () => {
    expect(typeof validateIPAddress).toBe("function");
  });
  
});

describe("validate has method isInt", () => {
  it("is a function", () => {
    expect(typeof validate.isInt).toBe("function");
  });

  it("is a function", () => {
    expect(typeof validateInt).toBe("function");
  });
  
});

describe("validate has method password", () => {
  it("is a function", () => {
    expect(typeof validate.password).toBe("function");
  });
  
  it("is a function", () => {
    expect(typeof validatePassword).toBe("function");
  });
});

describe("validate has method windowsFileName", () => {
  it("is a function", () => {
    expect(typeof validate.windowsFileName).toBe("function");
  });
  
  it("is a function", () => {
    expect(typeof validateWindowsFileName).toBe("function");
  });
});

describe("validate has method windowsPath", () => {
  it("is a function", () => {
    expect(typeof validate.windowsPath).toBe("function");
  });
  
  it("is a function", () => {
    expect(typeof validateWindowsPath).toBe("function");
  });
});