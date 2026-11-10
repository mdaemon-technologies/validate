'use strict';
/**
 * Smoke checks for the built bundles, shared by the smoke.test.* files.
 *
 * The full suite runs under Vitest, which needs Node 22.12 or later, but the
 * package supports Node 18. These checks run on every supported Node version
 * with nothing but node:test and node:assert, so they need no install and no
 * TypeScript. src/api.test.ts pins the exact export names; these check that
 * each bundle loads and works.
 *
 * Plain JavaScript on purpose: keep it to syntax and APIs Node 18.0 has. Each
 * file is run with plain `node`, not `node --test`, which Node 18.0 lacks;
 * node:test still runs the tests and sets a failing exit code.
 */
const assert = require('node:assert/strict');

/**
 * Runs the checks against one loaded module.
 *
 * @param {object} mod - The module as a consumer receives it: the named
 *   exports plus the convenience object on `default`.
 */
function exercise(mod) {
  const validate = mod.default;
  const named = namedExports(mod);

  // The default object's aliases and the named exports are the same functions.
  assert.ok(named.length > 0, 'the module has named exports');
  const exported = new Set(named.map(name => mod[name]));
  for (const [alias, fn] of Object.entries(validate)) {
    assert.equal(typeof fn, 'function', `default.${alias} is a function`);
    assert.ok(exported.has(fn), `default.${alias} is one of the named exports`);
  }
  assert.equal(new Set(Object.values(validate)).size, exported.size, 'every named export has an alias');

  assert.equal(validate.domain('example.com'), true);
  assert.equal(validate.domain('*.example.com', true), true);
  assert.equal(validate.domain('invalid'), false);
  assert.equal(validate.email('user@example.com'), true);
  assert.equal(validate.email('*@example.com', true), true);
  assert.equal(validate.email('notanemail'), false);
  assert.equal(validate.ip('192.168.0.1'), true);
  assert.equal(validate.ip('2001:db8::1'), true);
  assert.equal(validate.ip('10.0.0.0/8'), true);
  assert.equal(validate.ip('192.168.*.*', true), true);
  assert.equal(validate.ip('256.1.1.1'), false);
  assert.equal(validate.ipv4('1.2.3.4'), true);
  assert.equal(validate.ipv4('::1'), false);
  assert.equal(validate.ipv6('::1'), true);
  assert.equal(validate.header('X-Test: value'), true);
  assert.equal(validate.headerName('X-Test'), true);
  assert.equal(validate.headerValue('value'), true);
  assert.equal(validate.ldapDN('CN=Bob,OU=Users,DC=example,DC=com'), true);
  assert.equal(validate.windowsPath('C:\\Program Files\\App'), true);
  assert.equal(validate.windowsPath('C:\\bad|name'), false);
  assert.equal(validate.windowsFileName('file.txt'), true);
  assert.equal(validate.windowsFileName('bad:name'), false);
  assert.equal(validate.phoneNumber('1 (832) 526-7777'), true);
  assert.equal(validate.isInt('007'), true);
  assert.equal(validate.isInt('-5'), false);
  assert.equal(validate.hasControlCharacters('a\u0001'), true);
  assert.equal(validate.hasUpperCase('aB'), true);
  assert.equal(validate.hasLowerCase('AB'), false);
  assert.equal(validate.hasNumber('a1'), true);
  assert.equal(validate.hasSpecial('a!'), true);

  // Validators return false for wrong-typed input instead of throwing.
  for (const name of ['domain', 'email', 'ip', 'ipv4', 'ipv6', 'header', 'headerName', 'headerValue',
    'ldapDN', 'windowsPath', 'windowsFileName', 'phoneNumber', 'isInt', 'isValidPassword']) {
    assert.equal(validate[name](null), false, `${name}(null)`);
    assert.equal(validate[name](42), false, `${name}(42)`);
  }

  // Password requirements are module state; always reset them.
  try {
    assert.equal(validate.isValidPassword('Abcdef1!'), true);
    assert.equal(validate.setPasswordRequirements({ min: 10, upper: true }), true);
    assert.equal(validate.isValidPassword('Abcdef1!'), false);
    assert.deepEqual(plain(validate.password('abcdefghij')), {
      length: 10,
      controlCharacters: false,
      upper: false,
      min: true
    });
  } finally {
    validate.resetPasswordRequirements();
  }
  assert.equal(validate.isValidPassword('Abcdef1!'), true, 'requirements were reset');

  // Schemas: a validator looks its schema up by name at call time.
  const name = `smoke-${Math.random()}`;
  const validator = validate.createSchemaValidator(name, {
    type: 'object',
    properties: { user: { type: 'string', required: true, pattern: '^[a-z]+$' } }
  });
  assert.deepEqual(plain(validator({ user: 'abc' })), { valid: true, errors: [] });
  assert.deepEqual(plain(validator({ user: 'ABC' })), {
    valid: false,
    errors: ['user: Value does not match pattern ^[a-z]+$']
  });
  assert.deepEqual(plain(validator({})), { valid: false, errors: ['user: Value is required'] });
  validate.updateSchema(name, { type: 'string' });
  assert.equal(validator('text').valid, true);
  assert.deepEqual(plain(validate.getSchema(name)), { type: 'string' });
  // Matched by name: the UMD bundle's TypeError comes from the vm context's realm.
  assert.throws(() => validate.createSchemaValidator('', {}), { name: 'TypeError', message: /schema name/ });
}

/**
 * The module's named exports, without `default` and the CommonJS interop flag.
 *
 * @param {object} mod - A loaded module.
 * @returns {string[]} The sorted export names.
 */
function namedExports(mod) {
  return Object.keys(mod).filter(key => key !== 'default' && key !== '__esModule').sort();
}

/**
 * Copies a result into this realm. The UMD bundle runs in a vm context, whose
 * objects have that context's Object.prototype, and strict deep equality
 * compares prototypes.
 *
 * @param {unknown} value - A JSON-compatible result.
 * @returns {unknown} An equal value built from this realm's objects.
 */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { exercise, namedExports };
