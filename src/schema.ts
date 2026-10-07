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

// Compiled once at registration, keyed by the registered (normalized) schema node.
const compiledPatterns = new WeakMap<ISchema, RegExp>();

// Defines an own data property, so a "__proto__" key is copied as data instead of
// replacing the target's prototype.
function setOwn(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

// Registered schemas are private copies, so callers cannot mutate them afterwards.
// Shared objects are copied once and stay shared; a cycle is a TypeError.
function deepCopy<T>(value: T, copies: Map<object, unknown> = new Map(), ancestors: Set<object> = new Set()): T {
  if (!value || typeof value !== "object") {
      return value;
  }

  if (ancestors.has(value)) {
      throw new TypeError("A schema cannot contain circular references");
  }
  if (copies.has(value)) {
      return copies.get(value) as T;
  }

  ancestors.add(value);
  let copy: unknown;
  if (Array.isArray(value)) {
      copy = value.map(item => deepCopy(item, copies, ancestors));
  }
  else {
      const target: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
          setOwn(target, key, deepCopy((value as Record<string, unknown>)[key], copies, ancestors));
      }
      copy = target;
  }
  ancestors.delete(value);
  copies.set(value, copy);
  return copy as T;
}

/**
 * Copies a schema for registration, rejecting what would otherwise fail at
 * validation time: non-object sub-schemas, unknown types, invalid patterns and
 * cycles. A null `properties` or `arraySchema` is treated as absent. A sub-schema
 * shared by several properties is normalized once.
 */
function normalizeSchema(schema: unknown, path: string = "schema", normalized: Map<object, ISchema> = new Map(), ancestors: Set<object> = new Set()): ISchema {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new TypeError(`${path} must be a schema object`);
  }

  if (ancestors.has(schema)) {
      throw new TypeError(`${path} is circular`);
  }
  const done = normalized.get(schema);
  if (done) {
      return done;
  }
  ancestors.add(schema);

  const { properties, arraySchema, ...rest } = schema as ISchema;
  const copy: ISchema = deepCopy(rest);

  if (copy.type && !SCHEMA_TYPES.includes(copy.type)) {
      throw new TypeError(`${path}.type must be one of: ${SCHEMA_TYPES.join(", ")}`);
  }

  if (typeof copy.pattern === "string") {
      try {
          compiledPatterns.set(copy, new RegExp(copy.pattern));
      }
      catch {
          throw new TypeError(`${path}.pattern is not a valid regular expression: ${copy.pattern}`);
      }
  }

  if (properties != null) {
      if (typeof properties !== "object" || Array.isArray(properties)) {
          throw new TypeError(`${path}.properties must be an object`);
      }
      const normalizedProperties: Record<string, ISchema> = {};
      for (const propName of Object.keys(properties)) {
          setOwn(normalizedProperties, propName, normalizeSchema(properties[propName], `${path}.properties.${propName}`, normalized, ancestors));
      }
      copy.properties = normalizedProperties;
  }

  if (arraySchema != null) {
      copy.arraySchema = normalizeSchema(arraySchema, `${path}.arraySchema`, normalized, ancestors);
  }

  ancestors.delete(schema);
  normalized.set(schema, copy);
  return copy;
}

// Formats whatever a custom validator threw, including values that cannot be stringified.
function describeThrown(thrown: unknown): string {
  try {
      return thrown instanceof Error ? thrown.message : String(thrown);
  }
  catch {
      return "a value that cannot be displayed";
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
  return schema && deepCopy(schema);
}

/**
* Registers (or replaces) the schema for a name. The schema is validated and
* copied, so later changes to the object passed in have no effect. Validators
* created for the name look the schema up at call time, so they see the update.
*
* @param {string} name - The schema name.
* @param {ISchema} schema - The schema to register.
* @throws {TypeError} If the name is not a non-empty string, or the schema is
* malformed (a non-object sub-schema, an unknown type, an invalid pattern, or a cycle).
*/
export function updateSchema(name: string, schema: ISchema): void {
  if (!name || typeof name !== "string") {
      throw new TypeError("A string is required for the schema name");
  }

  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new TypeError("A JSON object is required for the schema");
  }

  schemas.set(name, normalizeSchema(schema));
}

function validateSchema(schema: ISchema, value: any): string[] {
  // An absent value is only objectionable when the schema is required, so
  // optional properties may be omitted. A required null is reported once, as
  // missing; any other null is a real value that is type-checked but never
  // recursed into.
  if (value === undefined || (value === null && schema.required)) {
      return schema.required ? ["Value is required"] : [];
  }

  const errors: string[] = [];
  const valueType = value === null ? "null" : (Array.isArray(value) ? "array" : typeof value);

  if (schema.type && schema.type !== valueType) {
      errors.push(`Expected ${schema.type}, got ${valueType}`);
  }
  else if (schema.type === "array" && schema.arraySchema) {
      value.forEach((item: any, index: number) => {
          validateSchema(schema.arraySchema!, item).forEach(error => errors.push(`[${index}]: ${error}`));
      });
  }
  else if (schema.type === "object" && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
          // Own properties only: an inherited member such as toString is not a value.
          const propValue = Object.prototype.hasOwnProperty.call(value, propName) ? value[propName] : undefined;
          validateSchema(propSchema, propValue).forEach(error => errors.push(`${propName}: ${error}`));
      }
  }

  if (typeof schema.minLength === "number" && typeof value === "string" && value.length < schema.minLength) {
      errors.push(`Minimum length is ${schema.minLength}`);
  }

  if (typeof schema.maxLength === "number" && typeof value === "string" && value.length > schema.maxLength) {
      errors.push(`Maximum length is ${schema.maxLength}`);
  }

  if (typeof schema.minimum === "number" && typeof value === "number" && value < schema.minimum) {
      errors.push(`Minimum value is ${schema.minimum}`);
  }

  if (typeof schema.maximum === "number" && typeof value === "number" && value > schema.maximum) {
      errors.push(`Maximum value is ${schema.maximum}`);
  }

  if (typeof schema.minItems === "number" && Array.isArray(value) && value.length < schema.minItems) {
      errors.push(`Minimum length is ${schema.minItems}`);
  }

  if (typeof schema.maxItems === "number" && Array.isArray(value) && value.length > schema.maxItems) {
      errors.push(`Maximum length is ${schema.maxItems}`);
  }

  if (Array.isArray(schema.options) && schema.options.length && !schema.options.includes(value)) {
      errors.push(`Invalid value, expected one of: ${schema.options.join(", ")}`);
  }

  if (typeof schema.validate === "function") {
      try {
          if (!schema.validate(value)) {
              errors.push("Custom validation failed");
          }
      }
      catch (error) {
          errors.push(`Custom validation threw: ${describeThrown(error)}`);
      }
  }

  if (typeof schema.pattern === "string" && typeof value === "string" &&
      !(compiledPatterns.get(schema) ?? new RegExp(schema.pattern)).test(value)) {
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

      const errors = validateSchema(schema, input);

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
