import test from 'tape';

import { production } from './fixture';
import { isDraft } from '../../../src/validation';

test('[isDraft] should return false if doc is invalid', t => {
  t.false(isDraft({ $field: 2 }), 'operator');
  t.false(isDraft({ 'test.field': 2 }), 'dot');
  t.false(isDraft({ a: { $field: 2 } }), 'nested operator');
  t.false(isDraft({ a: { 'test.field': 2 } }), 'nested dot');
  t.false(isDraft({ a: [{ $field: 2 }] }), 'array nested operator');
  t.false(isDraft({ a: [{ 'test.field': 2 }] }), 'array nested dot');

  t.end();
});

test('[isDraft] should return true is doc is valid', t => {
  t.true(isDraft(production));
  t.true(isDraft({}));
  t.true(isDraft({ a: null }));
  t.true(isDraft({ a: [null] }));
  t.true(isDraft({ date: '2010.09.31' }));
  t.true(isDraft({ date: {} }));
  t.true(isDraft({ a: '反復回転時計' }));
  t.true(isDraft({ a: 'a\\null\\undefined' }));
  t.true(isDraft({ _id: '1', a: { b: [{ c: [undefined] }] } }));

  t.end();
});
