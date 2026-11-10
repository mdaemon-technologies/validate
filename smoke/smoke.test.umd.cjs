'use strict';
// The UMD bundle, as a <script> tag loads it: window.validate.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { exercise, namedExports } = require('./exercise.cjs');

const DIST = path.resolve(__dirname, '..', 'dist');

test('dist/validate.umd.js defines window.validate', () => {
  // The package is "type": "module", so Node would load a .js file as ESM.
  // Run it as a classic script instead, the way a browser does.
  const file = path.join(DIST, 'validate.umd.js');
  const window = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), window, { filename: file });
  exercise(window.validate);
});

test('dist/validate.umd.js fills module.exports under a CommonJS loader', () => {
  // The bundle's CommonJS branch, which bundlers such as webpack 4 use.
  const file = path.join(DIST, 'validate.umd.js');
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module, exports: module.exports }, { filename: file });
  exercise(module.exports);
});

test('the CommonJS, ES module and UMD bundles export the same names', async () => {
  const window = {};
  const umd = path.join(DIST, 'validate.umd.js');
  vm.runInNewContext(fs.readFileSync(umd, 'utf8'), window, { filename: umd });
  const esm = await import('@mdaemon/validate');

  const cjsNames = namedExports(require('@mdaemon/validate'));
  assert.deepEqual(namedExports(esm), cjsNames);
  assert.deepEqual(namedExports(window.validate), cjsNames);
  assert.deepEqual(Object.keys(esm.default).sort(), Object.keys(window.validate.default).sort());
});
