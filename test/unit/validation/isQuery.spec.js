const test = require('tape');

const { isQuery } = require('../../build/validation');
const { invalidQuery } = require('../_utils');

test('[isQuery] should return false if query is invalid', t => {
  for (let i = 0; i < invalidQuery.length; i += 1) {
    t.false(isQuery(invalidQuery[i]), i);
  }

  t.end();
});

test('[isQuery] should return true if query is valid', t => {
  t.true({ test: 1 });
  t.true({ 'a.b.c': 1 });
  t.true({ $not: { test: 3 } });

  t.end();
});
