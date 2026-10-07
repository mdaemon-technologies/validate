import validate, { hasControlCharacters, validateDomain, validateIPAddress, validateWindowsPath } from "@mdaemon/validate";
import type { ISchema, ISchemaValidationResult, MDaemonPasswordRequirements, MDaemonValidate, MDaemonValidPassword } from "@mdaemon/validate";

// The default object is still an MDaemonValidate, whose signatures are as in 3.4.0.
const v: MDaemonValidate = validate;
v.domain("example.com", false);

// The default object itself accepts the optional arguments.
validate.domain("example.com");
validate.domain("example.com", null);
validate.email("a@b.com");
validate.ip("1.1.1.1");
validate.windowsPath("C:\\a");
validate.isValidPassword("Test1");
validate.hasControlCharacters("x");

validateDomain("example.com");
validateIPAddress("1.1.1.1");
validateWindowsPath("C:\\a");
hasControlCharacters("x");

const requirements: MDaemonPasswordRequirements = { min: 8, badPasswords: ["password"] };
validate.setPasswordRequirements(requirements);
const result: MDaemonValidPassword = validate.password("Test1");
const length: number = result.length;
const controlCharacters: boolean = result.controlCharacters;

const schema: ISchema = { type: "object", properties: { name: { type: "string", required: true } } };
const check: (input: unknown) => ISchemaValidationResult = validate.createSchemaValidator("user", schema);

// Negative checks: these must stay errors, so the declarations cannot silently decay to `any`.
// @ts-expect-error domain takes a string
validate.domain(42);
// @ts-expect-error length is a number
const notString: string = result.length;
// @ts-expect-error unknown schema type
const badSchema: ISchema = { type: "integer" };

export { length, controlCharacters, check, notString, badSchema };
