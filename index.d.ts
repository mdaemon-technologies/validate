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
    domain: function(string, boolean?): boolean;
    email: function(string, boolean?): boolean;
    hasLowerCase: function(string): boolean;
    hasNumber: function(string): boolean;
    hasSpecial: function(string): boolean;
    hasUpperCase: function(string): boolean;
    header: function(string, string): boolean;
    headerName: function(string): boolean;
    headerValue: function(string): boolean;
    ldapDN: function(string): boolean;
    ip: function(string, boolean?): boolean;
    isInt: function(string): boolean;
    password: function(string): MDaemonValidPassword,
    windowsFileName: function(string): boolean;
    windowsPath: function(string, boolean?): boolean;
}

declare namespace validate {
    type ProtoType = MDaemonValidate;
};