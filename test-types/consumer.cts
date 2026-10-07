import validate = require("@mdaemon/validate");
import type { ISchema, ISchemaValidationResult, MDaemonPasswordRequirements, MDaemonValidate, MDaemonValidPassword } from "@mdaemon/validate";

// The default object is still an MDaemonValidate, whose signatures are as in 3.4.0.
const v: MDaemonValidate = validate.default;
v.domain("example.com", false);

// The default object itself accepts the optional arguments.
validate.default.domain("example.com");
validate.default.domain("example.com", null);
validate.default.email("a@b.com");
validate.default.ip("1.1.1.1");
validate.default.windowsPath("C:\\a");
validate.default.isValidPassword("Test1");
validate.default.hasControlCharacters("x");

validate.validateDomain("example.com");
validate.validateEmailAddress("a@b.com", true);
validate.validateIPAddress("1.1.1.1");
validate.validateWindowsPath("C:\\a");
validate.hasControlCharacters("x");

const requirements: MDaemonPasswordRequirements = { min: 8, badPasswords: ["password"] };
validate.setPasswordRequirements(requirements);
const result: MDaemonValidPassword = validate.default.password("Test1");
const length: number = result.length;
const controlCharacters: boolean = result.controlCharacters;

const schema: ISchema = { type: "object", properties: { name: { type: "string", required: true } } };
const check: (input: unknown) => ISchemaValidationResult = validate.default.createSchemaValidator("user", schema);

// Negative checks: these must stay errors, so the declarations cannot silently decay to `any`.
// @ts-expect-error domain takes a string
validate.default.domain(42);
// @ts-expect-error length is a number
const notString: string = result.length;
// @ts-expect-error unknown schema type
const badSchema: ISchema = { type: "integer" };

export { length, controlCharacters, check, notString, badSchema };
