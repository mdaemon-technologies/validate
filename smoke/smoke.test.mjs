// The ES module entry, resolved through package.json's "exports" -> "import".
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import * as validate from '@mdaemon/validate';
import smoke from './exercise.cjs';

test('import loads dist/validate.mjs', () => {
  // import.meta.resolve needs a flag before Node 18.19; the import above has
  // already resolved either way, so this only pins down which file it chose.
  if (typeof import.meta.resolve === 'function') {
    assert.equal(
      fileURLToPath(import.meta.resolve('@mdaemon/validate')),
      fileURLToPath(new URL('../dist/validate.mjs', import.meta.url))
    );
  }
  smoke.exercise(validate);
});
