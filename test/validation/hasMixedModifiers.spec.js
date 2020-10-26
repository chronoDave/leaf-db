const test = require('tape');

const { hasMixedModifiers } = require('../../dist/validation');

test('[hasMixedModifiers] should return false is object does not have mixed modifiers', t => {
  t.false(hasMixedModifiers({ a: 1 }));
  t.false(hasMixedModifiers({ $a: 1 }));
  t.false(hasMixedModifiers({ a: 1, b: 1 }));
  t.false(hasMixedModifiers({ $a: 1, $b: 1 }));

  t.end();
});

test('[hasMixedModifiers] should return true if object has mixed modifiers', t => {
  t.true(hasMixedModifiers({ a: 1, $b: 1 }));

  t.end();
});
