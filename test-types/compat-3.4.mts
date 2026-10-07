// Code written against the 3.4.0 declarations (the hand-written dist/index.d.ts).
// It must keep compiling. 3.5.x may loosen function signatures (listed in the
// changelog), but it must not rename, remove or tighten anything, and the
// published interfaces keep their exact 3.4.0 shapes, apart from the 4.0.0 change
// below.
//
// 4.0.0 makes one breaking change: MDaemonValidPassword gains the required
// `controlCharacters` field, so code that builds one (or implements
// MDaemonValidate's `password`) must set it. Everything else here is unchanged.
import validate, * as named from "@mdaemon/validate";
import type { ISchema, ISchemaValidationResult, MDaemonPasswordRequirements, MDaemonValidate, MDaemonValidPassword } from "@mdaemon/validate";

// ---- The 3.4.0 declarations, verbatim apart from the V340 prefix ----

interface V340ValidPassword {
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
    length: number;
    min?: boolean;
    max?: boolean;
    badPassword?: boolean;
}

interface V340PasswordRequirements {
    upper?: boolean;
    lower?: boolean;
    number?: boolean;
    special?: boolean;
    min?: number;
    max?: number;
    badPasswords?: string[];
}

interface V340Schema {
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    minItems?: number;
    maxItems?: number;
    options?: any[];
    validate?: (value: any) => boolean;
    pattern?: string;
    properties?: Record<string, V340Schema>;
    arraySchema?: V340Schema;
}

interface V340SchemaValidationResult {
    valid: boolean;
    errors: string[];
}

interface V340Validate {
    domain: (domain: string, useWildCards: boolean | null) => boolean;
    email: (email: string, useWildCards: boolean | null) => boolean;
    hasLowerCase: (name: string) => boolean;
    hasNumber: (str: string) => boolean;
    hasSpecial: (str: string) => boolean;
    hasUpperCase: (str: string) => boolean;
    isValidPassword: (str: string, bRequireSpecial: boolean, nMinLength: number, nMaxLength: number) => boolean;
    password: (str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number) => V340ValidPassword;
    header: (header: string) => boolean;
    headerName: (name: string) => boolean;
    headerValue: (value: string) => boolean;
    ip: (ip: string, useWildCards: boolean | null) => boolean;
    ipv4: (ip: string) => boolean;
    ipv6: (ip: string) => boolean;
    isInt: (value: string) => boolean;
    ldapDN: (str: string) => boolean;
    phoneNumber: (str: string) => boolean;
    windowsFileName: (str: string) => boolean;
    windowsPath: (str: string, useWildCards: boolean | null) => boolean;
    getSchema: (name: string) => V340Schema | undefined;
    updateSchema: (name: string, schema: V340Schema) => void;
    createSchemaValidator: (name: string, schema: V340Schema) => (input: any) => V340SchemaValidationResult;
    setPasswordRequirements: (obj: Partial<V340PasswordRequirements>) => boolean;
    resetPasswordRequirements: () => void;
}

// ---- The 4.0.0 change, exactly ----

interface V400ValidPassword extends V340ValidPassword {
    controlCharacters: boolean;
}

interface V400Validate extends Omit<V340Validate, "password"> {
    password: (str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number) => V400ValidPassword;
}

// ---- The published interfaces keep their exact shapes ----

// Each type is assignable to its twin and back, so neither code that reads
// these types nor code that builds or implements them can break beyond the
// 4.0.0 change above.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameValidPassword: Same<MDaemonValidPassword, V400ValidPassword> = true;
const samePasswordRequirements: Same<MDaemonPasswordRequirements, V340PasswordRequirements> = true;
const sameSchema: Same<ISchema, V340Schema> = true;
const sameSchemaValidationResult: Same<ISchemaValidationResult, V340SchemaValidationResult> = true;
const sameValidate: Same<MDaemonValidate, V400Validate> = true;

// Code that only reads a result still accepts it as the 3.4.0 type.
const readsAsV340: V340ValidPassword = {} as MDaemonValidPassword;

// ---- Every named function still accepts every 3.4.0 call and returns a type 3.4.0 code can read ----

// validatePassword returns exactly the 4.0.0 type.
const validatePasswordReturn: Same<ReturnType<typeof named.validatePassword>, V400ValidPassword> = true;

const namedFunctions: {
    validateDomain(domain: string, useWildCards: boolean): boolean;
    validateEmailAddress(email: string, useWildCards: boolean): boolean;
    validateHeaderName(name: string): boolean;
    validateHeaderValue(value: string): boolean;
    validateHeader(header: string): boolean;
    validateIPAddress(ip: string, useWildCards: boolean): boolean;
    validateIPv4(ip: string): boolean;
    validateIPv6(ip: string): boolean;
    validateInt(value: string): boolean;
    validatePhoneNumber(str: string): boolean;
    validateWindowsFileName(str: string): boolean;
    validateWindowsPath(str: string, useWildCards: boolean): boolean;
    validateLdapDN(str: string): boolean;
    hasUpperCase(str: string): boolean;
    hasLowerCase(str: string): boolean;
    hasNumber(str: string): boolean;
    hasSpecial(str: string): boolean;
    validatePassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): V340ValidPassword;
    isValidPassword(str: string, bRequireSpecial?: boolean, nMinLength?: number, nMaxLength?: number): boolean;
    setPasswordRequirements(obj: Partial<V340PasswordRequirements>): boolean;
    resetPasswordRequirements(): void;
    getSchema(name: string): V340Schema | undefined;
    updateSchema(name: string, schema: V340Schema): void;
    createSchemaValidator(name: string, schema: V340Schema): (input: any) => V340SchemaValidationResult;
} = named;

// ---- The default export ----

// It is still usable as the 3.4.0 MDaemonValidate.
const asV340: V340Validate = validate;

// Inference from an intersection of signatures (jest.spyOn, Parameters<>) uses the
// last one. It must stay the 3.4.0 signature, so typed mocks written for 3.4.0 compile.
const domainArgs: Same<Parameters<typeof validate.domain>, [string, boolean | null]> = true;
const passwordArgs: Same<Parameters<typeof validate.password>, [string, boolean, number?, number?]> = true;
const isValidPasswordArgs: Same<Parameters<typeof validate.isValidPassword>, [string, boolean, number, number]> = true;
declare function spyLike<T extends (...args: any[]) => any>(
    target: T, implementation: (...args: Parameters<T>) => ReturnType<T>): void;
spyLike(validate.domain, (domain: string, useWildCards: boolean | null) => true);
const v340Result: V340ValidPassword = { upper: true, lower: true, number: true, special: true, length: 5 };
// @ts-expect-error 4.0.0: a mock of password that returns a 3.4.0-shaped result no longer compiles
spyLike(validate.password, () => v340Result);

// Calls through the interface with the 3.4.0 argument shapes.
const v: MDaemonValidate = validate;
const domainOk: boolean = v.domain("example.com", null);
const validOk: boolean = v.isValidPassword("Test1", false, 4, 20);

// ---- Using the published types as 3.4.0 code did ----

// The character-class fields are declared required.
const result: MDaemonValidPassword = named.validatePassword("Test1", true, 4, 20);
const upper: boolean = result.upper;
const special: boolean = result.special;

// The arrays are declared mutable.
const requirements: MDaemonPasswordRequirements = { upper: true, badPasswords: ["password"] };
requirements.badPasswords?.push("letmein");
const schema: ISchema = { type: "string", options: ["a"] };
schema.options?.push("b");

// An implementation of MDaemonValidate with the 3.4.0 parameter lists.
const no = () => false;
const built: MDaemonValidPassword = { upper: true, lower: true, number: true, special: true, length: 5, controlCharacters: false };
// @ts-expect-error 4.0.0: a result built without controlCharacters no longer compiles
const builtAsV340: MDaemonValidPassword = { upper: true, lower: true, number: true, special: true, length: 5 };
const mock: MDaemonValidate = {
    domain: (domain: string, useWildCards: boolean | null) => no(),
    email: (email: string, useWildCards: boolean | null) => no(),
    hasLowerCase: (name: string) => no(),
    hasNumber: (str: string) => no(),
    hasSpecial: (str: string) => no(),
    hasUpperCase: (str: string) => no(),
    isValidPassword: (str: string, bRequireSpecial: boolean, nMinLength: number, nMaxLength: number) => no(),
    password: (str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number) => built,
    header: (header: string) => no(),
    headerName: (name: string) => no(),
    headerValue: (value: string) => no(),
    ip: (ip: string, useWildCards: boolean | null) => no(),
    ipv4: (ip: string) => no(),
    ipv6: (ip: string) => no(),
    isInt: (value: string) => no(),
    ldapDN: (str: string) => no(),
    phoneNumber: (str: string) => no(),
    windowsFileName: (str: string) => no(),
    windowsPath: (str: string, useWildCards: boolean | null) => no(),
    getSchema: (name: string) => undefined,
    updateSchema: (name: string, schema: ISchema) => undefined,
    createSchemaValidator: (name: string, schema: ISchema) => (input: any): ISchemaValidationResult => ({ valid: true, errors: [] }),
    setPasswordRequirements: (obj: Partial<MDaemonPasswordRequirements>) => true,
    resetPasswordRequirements: () => undefined
};

export {
    sameValidPassword, samePasswordRequirements, sameSchema, sameSchemaValidationResult, sameValidate, readsAsV340, builtAsV340,
    namedFunctions, validatePasswordReturn, asV340, domainArgs, passwordArgs, isValidPasswordArgs, domainOk, validOk,
    upper, special, mock
};
