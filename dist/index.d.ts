export interface MDaemonValidPassword {
    special: boolean;
    lower: boolean;
    upper: boolean;
    number: boolean;
    length: number;
}

export function validateDomain(domain: string, useWildCards: boolean): boolean;
export function validateEmailAddress(email: string, useWildCards: boolean): boolean;
export function validateHeaderName(name: string): boolean;
export function validateHeaderValue(value: string): boolean;
export function validateHeader(header: string): boolean;
export function validateIPAddress(ip: string, useWildCards: boolean): boolean;
export function validateInt(value: string): boolean;
export function validateWindowsFileName(str: string): boolean;
export function validateWindowsPath(str: string, useWildCards: boolean): boolean;
export function validateLdapDN(str: string): boolean;
export function hasUpperCase(str: string): boolean;
export function hasLowerCase(str: string): boolean;
export function hasNumber(str: string): boolean;
export function hasSpecial(str: string): boolean;
export function validatePassword(str: string, bRequireSpecial: boolean): MDaemonValidPassword;

export interface MDaemonValidate {
    domain: (domain: string, useWildCards: boolean | null) => boolean;
    email: (email: string, useWildCards: boolean | null) => boolean;
    hasLowerCase: (name: string) => boolean;
    hasNumber: (str: string) => boolean;
    hasSpecial: (str: string) => boolean;
    hasUpperCase: (str: string) => boolean;
    header: (header: string) => boolean;
    headerName: (name: string) => boolean;
    headerValue: (value: string) => boolean;
    ldapDN: (str: string) => boolean;
    ip: (ip: string, useWildCards: boolean | null) => boolean;
    isInt: (value: string) => boolean;
    password: (str: string, bRequireSpecial: boolean ) => MDaemonValidPassword,
    windowsFileName: (str: string) => boolean;
    windowsPath: (str: string, useWildCards: boolean | null) => boolean;
}

declare namespace validate {
    type ProtoType = MDaemonValidate;
}
