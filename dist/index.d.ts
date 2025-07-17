export interface MDaemonValidPassword {
    special: boolean;
    lower: boolean;
    upper: boolean;
    number: boolean;
    length: number;
    min?: boolean;
    max?: boolean;
}

export interface MDaemonPasswordRequirements {
    upper?: boolean;
    lower?: boolean;
    number?: boolean;
    special?: boolean;
    min?: number;
    max?: number;
}

export interface ISchema {
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
    properties?: Record<string, ISchema>;
    arraySchema?: ISchema;
}

export interface ISchemaValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateDomain(domain: string, useWildCards: boolean): boolean;
export function validateEmailAddress(email: string, useWildCards: boolean): boolean;

export function validateHeaderName(name: string): boolean;
export function validateHeaderValue(value: string): boolean;
export function validateHeader(header: string): boolean;

export function validateIPAddress(ip: string, useWildCards: boolean): boolean;
export function validateIPv4(ip: string): boolean;
export function validateIPv6(ip: string): boolean;

export function validateInt(value: string): boolean;

export function validatePhoneNumber(str: string): boolean;

export function validateWindowsFileName(str: string): boolean;
export function validateWindowsPath(str: string, useWildCards: boolean): boolean;

export function validateLdapDN(str: string): boolean;

export function hasUpperCase(str: string): boolean;
export function hasLowerCase(str: string): boolean;
export function hasNumber(str: string): boolean;
export function hasSpecial(str: string): boolean;
export function validatePassword(str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number): MDaemonValidPassword;
export function isValidPassword(str: string, bRequireSpecial: boolean, nMinLength: number, nMaxLength: number): boolean;
export function setPasswordRequirements(obj: Partial<MDaemonValidPassword>): boolean;
export function resetPasswordRequirements(): void;

// Schema-related functions
export function getSchema(name: string): ISchema | undefined;
export function updateSchema(name: string, schema: ISchema): void;
export function createSchemaValidator(name: string, schema: ISchema): (input: any) => ISchemaValidationResult;

export interface MDaemonValidate {
    domain: (domain: string, useWildCards: boolean | null) => boolean;
    email: (email: string, useWildCards: boolean | null) => boolean;

    hasLowerCase: (name: string) => boolean;
    hasNumber: (str: string) => boolean;
    hasSpecial: (str: string) => boolean;
    hasUpperCase: (str: string) => boolean;
    isValidPassword: (str: string, bRequireSpecial: boolean, nMinLength: number, nMaxLength: number) => boolean;
    password: (str: string, bRequireSpecial: boolean, nMinLength?: number, nMaxLength?: number) => MDaemonValidPassword;

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
    
    // Schema-related methods
    getSchema: (name: string) => ISchema | undefined;
    updateSchema: (name: string, schema: ISchema) => void;
    createSchemaValidator: (name: string, schema: ISchema) => (input: any) => ISchemaValidationResult;
    setPasswordRequirements: (obj: Partial<MDaemonPasswordRequirements>) => boolean;
    resetPasswordRequirements: () => void;
}

declare namespace validate {
    type ProtoType = MDaemonValidate;
}

export default validate;
