const test = require('tape');

const { hasMixedOperators } = require('../../build/validation');

test('[hasMixedOperators] should return false is object does not have mixed modifiers', t => {
  t.false(hasMixedOperators({ a: 1 }));
  t.false(hasMixedOperators({ $a: 1 }));
  t.false(hasMixedOperators({ a: 1, b: 1 }));
  t.false(hasMixedOperators({ $a: 1, $b: 1 }));

  t.end();
});

test('[hasMixedOperators] should return true if object has mixed modifiers', t => {
  t.true(hasMixedOperators({ a: 1, $b: 1 }));

  t.end();
});
