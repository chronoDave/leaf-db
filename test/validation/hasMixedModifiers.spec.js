const test = require('tape');

const { hasMixedModifiers } = require('../../src/validation');

test('[hasMixedModifiers] should return false is object does not have mixed modifiers', t => {
  t.notOk(hasMixedModifiers({ a: 1 }));
  t.notOk(hasMixedModifiers({ $a: 1 }));
  t.notOk(hasMixedModifiers({ a: 1, b: 1 }));
  t.notOk(hasMixedModifiers({ $a: 1, $b: 1 }));

  t.end();
});

test('[hasMixedModifiers] should return true if object has mixed modifiers', t => {
  t.ok(hasMixedModifiers({ a: 1, $b: 1 }));

  t.end();
});
