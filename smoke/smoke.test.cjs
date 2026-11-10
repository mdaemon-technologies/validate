'use strict';
// The CommonJS entry, resolved through package.json's "exports" -> "require".
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { exercise } = require('./exercise.cjs');

test('require() loads dist/validate.cjs', () => {
  assert.equal(
    require.resolve('@mdaemon/validate'),
    path.resolve(__dirname, '..', 'dist', 'validate.cjs')
  );
  exercise(require('@mdaemon/validate'));
});
