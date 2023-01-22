import test from 'tape';

import { isQuery } from '../../../src/validation';
import { query } from './fixture';

test('[isQuery] should return false if query is invalid', t => {
  for (let i = 0; i < query.length; i += 1) {
    t.false(isQuery(query[i]), `${i}`);
  }

  t.end();
});

test('[isQuery] should return true if query is valid', t => {
  t.true({ test: 1 });
  t.true({ 'a.b.c': 1 });
  t.true({ $not: { test: 3 } });

  t.end();
});
