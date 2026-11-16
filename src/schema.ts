/*
*    Copyright (C) 1998-2026  MDaemon Technologies, Ltd.
*
*    This library is free software; you can redistribute it and/or
*    modify it under the terms of the GNU Lesser General Public
*    License as published by the Free Software Foundation; either
*    version 2.1 of the License, or (at your option) any later version.
*
*    This library is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*    Lesser General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public
*    License along with this library; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
*    USA
*/

/*
* Schema validation functions
*
* Example schemas:
*
* const userSchema = {
*   type: "object",
*   properties: {
*     name: { type: "string", required: true, minLength: 2 },
*     age: { type: "number", minimum: 0, maximum: 120 },
*     email: { type: "string", required: true }
*   }
* }
*
* const productSchema = {
*   type: "object",
*   properties: {
*     id: { type: "string", required: true },
*     price: { type: "number", required: true, minimum: 0 },
*     inStock: { type: "boolean", required: true }
*   }
* }
*/

export interface ISchemaValidationResult {
  valid: boolean;
  errors: string[];
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

const schemas = new Map<string, ISchema>();

const SCHEMA_TYPES: readonly string[] = ["string", "number", "boolean", "array", "object"];

// The deepest a schema may nest objects and arrays, counting every level: a
// schema, its properties object, an options array and anything inside it. It
// keeps registration, getSchema and validation, which all recurse, far from
// the engine's stack limit.
const MAX_SCHEMA_DEPTH = 1000;

// The constraints checked at registration, where null or undefined means
// absent, as for properties and arraySchema. All but `required` have their
// types checked; it has always been read as truthy or falsy.
const NUMBER_CONSTRAINTS = ["minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems"] as const;
const CONSTRAINTS = ["type", "required", "options", "validate", "pattern", ...NUMBER_CONSTRAINTS] as const;

// Compiled once at registration, keyed by the registered (normalized) schema node.
const compiledPatterns = new WeakMap<ISchema, RegExp>();

// Reported for a value, or part of one, that throws when read (a revoked
// Proxy, a throwing getter or Proxy trap).
const UNREADABLE_ERROR = "Value could not be read";

// Stands in for a value that threw when read. It is private, so no input can be it.
const UNREADABLE = Symbol("unreadable");

const UNDISPLAYABLE = "a value that cannot be displayed";

// A copy, and the number of nested object levels it holds (1 for an object of primitives).
interface ICopy<T> {
  copy: T;
  height: number;
}

// Throws when an object at `depth` (the root is 1) holding `height` levels would
// nest deeper than the limit. A shared object is checked again at each use.
function checkDepth(depth: number, height: number): void {
  if (depth + height - 1 > MAX_SCHEMA_DEPTH) {
      throw new TypeError(`A schema cannot nest objects and arrays more than ${MAX_SCHEMA_DEPTH} levels deep`);
  }
}

// Defines an own data property, so a "__proto__" key is copied as data instead of
// replacing the target's prototype.
function setOwn(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

// The built-in getters, so that a RegExp's own "source" or "flags" property
// cannot stand in for the real ones.
const getRegExpSource = Object.getOwnPropertyDescriptor(RegExp.prototype, "source")!.get!;
const getRegExpFlags = Object.getOwnPropertyDescriptor(RegExp.prototype, "flags")!.get!;

// Copies a RegExp, including one from another realm, or returns undefined for
// anything else. The tag is a cheap filter; the source getter is the brand
// check, since it throws for anything else.
function copyRegExp(value: object): RegExp | undefined {
  if (Object.prototype.toString.call(value) !== "[object RegExp]") {
      return undefined;
  }
  let source: string;
  try {
      source = getRegExpSource.call(value);
  }
  catch {
      return undefined;
  }
  return new RegExp(source, getRegExpFlags.call(value));
}

function copyData(value: unknown, depth: number, copies: Map<object, ICopy<unknown>>, ancestors: Set<object>): ICopy<unknown> {
  if (!value || typeof value !== "object") {
      return { copy: value, height: 0 };
  }

  if (ancestors.has(value)) {
      throw new TypeError("A schema cannot contain circular references");
  }
  const done = copies.get(value);
  if (done) {
      checkDepth(depth, done.height);
      return done;
  }
  checkDepth(depth, 1);

  let result: ICopy<unknown>;
  const regex = copyRegExp(value);
  if (regex) {
      result = { copy: regex, height: 1 };
  }
  else {
      ancestors.add(value);
      let childHeight = 0;
      const copyChild = (child: unknown): unknown => {
          const copied = copyData(child, depth + 1, copies, ancestors);
          childHeight = Math.max(childHeight, copied.height);
          return copied.copy;
      };
      let copy: unknown;
      if (Array.isArray(value)) {
          copy = value.map(copyChild);
      }
      else {
          const target: Record<string, unknown> = {};
          for (const key of Object.keys(value)) {
              setOwn(target, key, copyChild((value as Record<string, unknown>)[key]));
          }
          copy = target;
      }
      ancestors.delete(value);
      result = { copy, height: childHeight + 1 };
  }
  copies.set(value, result);
  return result;
}

// Registered schemas are private copies, so callers cannot mutate them afterwards.
// Shared objects are copied once and stay shared; a cycle, or nesting deeper
// than MAX_SCHEMA_DEPTH, is a TypeError. RegExps are copied as RegExps.
function deepCopy<T>(value: T, depth: number = 1): ICopy<T> {
  return copyData(value, depth, new Map(), new Set()) as ICopy<T>;
}

// Throws unless each constraint present has its documented type, and drops the
// ones that are null or undefined. Compiles the pattern.
function checkConstraints(copy: ISchema, path: string): void {
  const fields = copy as Record<string, unknown>;
  for (const key of CONSTRAINTS) {
      if (fields[key] == null) {
          delete fields[key];
      }
  }

  if (copy.type !== undefined && !SCHEMA_TYPES.includes(copy.type)) {
      throw new TypeError(`${path}.type must be one of: ${SCHEMA_TYPES.join(", ")}`);
  }
  // NaN would make the check always pass or always fail; an infinite limit is no limit.
  for (const key of NUMBER_CONSTRAINTS) {
      const limit = fields[key];
      if (limit !== undefined && (typeof limit !== "number" || Number.isNaN(limit))) {
          throw new TypeError(`${path}.${key} must be a number`);
      }
  }
  if (copy.options !== undefined && !Array.isArray(copy.options)) {
      throw new TypeError(`${path}.options must be an array`);
  }
  if (copy.validate !== undefined && typeof copy.validate !== "function") {
      throw new TypeError(`${path}.validate must be a function`);
  }

  // The published type says string, but a RegExp is accepted too (copyData has
  // already copied it into this realm). The g and y flags are dropped because
  // they make test() stateful.
  const pattern: unknown = copy.pattern;
  if (typeof pattern === "string") {
      try {
          compiledPatterns.set(copy, new RegExp(pattern));
      }
      catch {
          throw new TypeError(`${path}.pattern is not a valid regular expression: ${pattern}`);
      }
  }
  else if (pattern !== undefined) {
      if (!(pattern instanceof RegExp)) {
          throw new TypeError(`${path}.pattern must be a string or a RegExp`);
      }
      const regex = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
      (copy as { pattern?: unknown }).pattern = regex;
      compiledPatterns.set(copy, regex);
  }
}

/**
 * Copies a schema for registration, rejecting what would otherwise fail or be
 * ignored at validation time: non-object sub-schemas, wrongly typed
 * constraints, unknown types, invalid patterns, cycles and nesting deeper than
 * MAX_SCHEMA_DEPTH. A null constraint, `properties` or `arraySchema` is treated
 * as absent. A sub-schema shared by several properties is normalized once.
 */
function normalizeSchema(schema: unknown, path: string, depth: number, normalized: Map<object, ICopy<ISchema>>, ancestors: Set<object>): ICopy<ISchema> {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new TypeError(`${path} must be a schema object`);
  }

  if (ancestors.has(schema)) {
      throw new TypeError(`${path} is circular`);
  }
  const done = normalized.get(schema);
  if (done) {
      checkDepth(depth, done.height);
      return done;
  }
  checkDepth(depth, 1);
  ancestors.add(schema);

  const { properties, arraySchema, ...rest } = schema as ISchema;
  const { copy, height: restHeight } = deepCopy<ISchema>(rest, depth);
  let height = restHeight;

  checkConstraints(copy, path);

  if (properties != null) {
      if (typeof properties !== "object" || Array.isArray(properties)) {
          throw new TypeError(`${path}.properties must be an object`);
      }
      // As in copyData, the properties object is a level of its own (depth + 1),
      // so each property schema sits at depth + 2.
      checkDepth(depth + 1, 1);
      const normalizedProperties: Record<string, ISchema> = {};
      for (const propName of Object.keys(properties)) {
          const property = normalizeSchema(properties[propName], `${path}.properties.${propName}`, depth + 2, normalized, ancestors);
          setOwn(normalizedProperties, propName, property.copy);
          height = Math.max(height, property.height + 2);
      }
      copy.properties = normalizedProperties;
      height = Math.max(height, 2);
  }

  if (arraySchema != null) {
      const item = normalizeSchema(arraySchema, `${path}.arraySchema`, depth + 1, normalized, ancestors);
      copy.arraySchema = item.copy;
      height = Math.max(height, item.height + 1);
  }

  ancestors.delete(schema);
  const result = { copy, height };
  normalized.set(schema, result);
  return result;
}

// Converts any value to a string for an error message, without throwing.
function display(value: unknown): string {
  try {
      return String(value);
  }
  catch {
      return UNDISPLAYABLE;
  }
}

// Formats whatever a custom validator threw, including values that cannot be stringified.
function describeThrown(thrown: unknown): string {
  try {
      return display(thrown instanceof Error ? thrown.message : thrown);
  }
  catch {
      return UNDISPLAYABLE;
  }
}

// Reads one of the value's own properties (or array items): an inherited one,
// or an array hole, is undefined. Returns UNREADABLE when the read throws.
function readOwn(value: object, key: string | number): unknown {
  try {
      return Object.prototype.hasOwnProperty.call(value, key) ? (value as Record<string | number, unknown>)[key] : undefined;
  }
  catch {
      return UNREADABLE;
  }
}

/**
* Returns a copy of the schema registered under a name.
*
* @param {string} name - The schema name.
* @returns {ISchema | undefined} A deep copy of the schema, or undefined if none is registered.
*/
export function getSchema(name: string): ISchema | undefined {
  const schema = schemas.get(name);
  return schema && deepCopy(schema).copy;
}

/**
* Registers (or replaces) the schema for a name. The schema is validated and
* copied, so later changes to the object passed in have no effect. Validators
* created for the name look the schema up at call time, so they see the update.
*
* @param {string} name - The schema name.
* @param {ISchema} schema - The schema to register.
* @throws {TypeError} If the name is not a non-empty string, or the schema is
* malformed (a non-object sub-schema, a wrongly typed constraint, an unknown
* type, an invalid pattern, a cycle, or nesting deeper than 1000 levels).
*/
export function updateSchema(name: string, schema: ISchema): void {
  if (!name || typeof name !== "string") {
      throw new TypeError("A string is required for the schema name");
  }

  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new TypeError("A JSON object is required for the schema");
  }

  schemas.set(name, normalizeSchema(schema, "schema", 1, new Map(), new Set()).copy);
}

// The length of an array value; throws when it cannot be read or is not a
// possible array length (a Proxy can report anything).
function arrayLength(value: unknown[]): number {
  const length: unknown = value.length;
  if (typeof length !== "number" || !Number.isInteger(length) || length < 0 || length > 4294967295) {
      throw new TypeError("Not an array length");
  }
  return length;
}

// A canonical array index: no sign, no leading zero, no fraction.
const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;

// The array's own indices below its length, in ascending order. It costs time
// in the number of own properties, not the length, so a huge sparse array is
// cheap. Throws when the keys cannot be listed (a Proxy's ownKeys trap).
function ownIndices(value: object, length: number): number[] {
  const indices: number[] = [];
  for (const key of Object.getOwnPropertyNames(value)) {
      if (ARRAY_INDEX.test(key)) {
          const index = Number(key);
          if (index < length) {
              indices.push(index);
          }
      }
  }
  // An ordinary array lists them in order already; a Proxy may not.
  return indices.sort((a, b) => a - b);
}

// Validates an array's items: those at its own `indices` (from ownIndices) one
// by one, and each run of holes between them as one absent item, reported
// once as "[i]-[j]: " (or "[i]: " for a single hole).
function validateItems(itemSchema: ISchema, value: object, length: number, indices: number[], errors: string[]): void {
  const holeErrors = validateSchema(itemSchema, undefined);
  const reportHoles = (first: number, last: number): void => {
      const label = first === last ? `[${first}]` : `[${first}]-[${last}]`;
      for (const error of holeErrors) {
          errors.push(`${label}: ${error}`);
      }
  };

  let next = 0;
  for (const index of indices) {
      if (index > next) {
          reportHoles(next, index - 1);
      }
      for (const error of validateSchema(itemSchema, readOwn(value, index))) {
          errors.push(`[${index}]: ${error}`);
      }
      next = index + 1;
  }
  if (next < length) {
      reportHoles(next, length - 1);
  }
}

function validateSchema(schema: ISchema, value: unknown): string[] {
  if (value === UNREADABLE) {
      return [UNREADABLE_ERROR];
  }

  // An absent value is only objectionable when the schema is required, so
  // optional properties may be omitted. A required null is reported once, as
  // missing; any other null is a real value that is type-checked but never
  // recursed into.
  if (value === undefined || (value === null && schema.required)) {
      return schema.required ? ["Value is required"] : [];
  }

  // The value is read only here, through ownIndices and readOwn, and by the
  // custom validator, each guarded, so a hostile value (a revoked Proxy, a throwing getter or
  // trap) is reported instead of throwing.
  let valueType: string;
  let length = 0;
  try {
      valueType = value === null ? "null" : (Array.isArray(value) ? "array" : typeof value);
      if (valueType === "array") {
          length = arrayLength(value as unknown[]);
      }
  }
  catch {
      return [UNREADABLE_ERROR];
  }

  const errors: string[] = [];

  if (schema.type && schema.type !== valueType) {
      errors.push(`Expected ${schema.type}, got ${valueType}`);
  }
  else if (schema.type === "array" && schema.arraySchema) {
      let indices: number[];
      try {
          indices = ownIndices(value as object, length);
      }
      catch {
          return [UNREADABLE_ERROR];
      }
      validateItems(schema.arraySchema, value as object, length, indices, errors);
  }
  else if (schema.type === "object" && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
          // Own properties only: an inherited member such as toString is not a value.
          for (const error of validateSchema(propSchema, readOwn(value as object, propName))) {
              errors.push(`${propName}: ${error}`);
          }
      }
  }

  if (typeof schema.minLength === "number" && typeof value === "string" && value.length < schema.minLength) {
      errors.push(`Minimum length is ${schema.minLength}`);
  }

  if (typeof schema.maxLength === "number" && typeof value === "string" && value.length > schema.maxLength) {
      errors.push(`Maximum length is ${schema.maxLength}`);
  }

  // Written so that NaN, which is outside every range, fails.
  if (typeof schema.minimum === "number" && typeof value === "number" && !(value >= schema.minimum)) {
      errors.push(`Minimum value is ${schema.minimum}`);
  }

  if (typeof schema.maximum === "number" && typeof value === "number" && !(value <= schema.maximum)) {
      errors.push(`Maximum value is ${schema.maximum}`);
  }

  if (typeof schema.minItems === "number" && valueType === "array" && length < schema.minItems) {
      errors.push(`Minimum length is ${schema.minItems}`);
  }

  if (typeof schema.maxItems === "number" && valueType === "array" && length > schema.maxItems) {
      errors.push(`Maximum length is ${schema.maxItems}`);
  }

  if (schema.options && schema.options.length && !schema.options.includes(value)) {
      errors.push(`Invalid value, expected one of: ${schema.options.map(display).join(", ")}`);
  }

  const validate = schema.validate;
  if (validate) {
      try {
          // Called without a this, so it cannot reach (and change) the registered schema.
          if (!Reflect.apply(validate, undefined, [value])) {
              errors.push("Custom validation failed");
          }
      }
      catch (error) {
          errors.push(`Custom validation threw: ${describeThrown(error)}`);
      }
  }

  // A string pattern is reported as written, a RegExp one as /source/flags.
  const regex = compiledPatterns.get(schema);
  if (regex && typeof value === "string" && !regex.test(value)) {
      errors.push(`Value does not match pattern ${schema.pattern}`);
  }

  return errors;
}

function getSchemaValidatorFunction(name: string): (input: any) => ISchemaValidationResult {
  return (input: any): ISchemaValidationResult => {
      const schema = schemas.get(name);
      if (!schema || typeof schema !== "object") {
          return { valid: false, errors: [`No schema registered for "${name}"`] };
      }

      // validateSchema reports hostile values itself, but recursion can still run
      // out of stack when the caller is already deep in it. Never throw.
      let errors: string[];
      try {
          errors = validateSchema(schema, input);
      } catch (error) {
          errors = [error instanceof RangeError
              ? "Value could not be validated: the stack ran out"
              : "Value could not be validated"];
      }

      return {
          valid: errors.length === 0,
          errors
      };
  };
}

/**
* Registers a schema under a name and returns a validator for that name. The
* validator reports problems as { valid, errors } instead of throwing; nested
* errors are prefixed with "propName: " or "[index]: ".
*
* @param {string} name - The schema name.
* @param {ISchema} schema - The schema to register.
* @returns {(input: any) => ISchemaValidationResult} The validator.
* @throws {TypeError} Under the same conditions as updateSchema.
*/
export function createSchemaValidator(name: string, schema: ISchema): (input: any) => ISchemaValidationResult {
  updateSchema(name, schema);

  return getSchemaValidatorFunction(name);
}
