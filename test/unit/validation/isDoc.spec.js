const test = require('tape');

const { isDoc } = require('../../build/validation');

// Utils
const { mockObjectProduction } = require('../_utils');

test('[isDoc] should return false if doc is invalid', t => {
  t.false(isDoc({ $field: 2 }), 'operator');
  t.false(isDoc({ 'test.field': 2 }), 'dot');
  t.false(isDoc({ a: { $field: 2 } }), 'nested operator');
  t.false(isDoc({ a: { 'test.field': 2 } }), 'nested dot');
  t.false(isDoc({ a: [{ $field: 2 }] }), 'array nested operator');
  t.false(isDoc({ a: [{ 'test.field': 2 }] }), 'array nested dot');

  t.end();
});

test('[isDoc] should return true is doc is valid', t => {
  t.true(isDoc(mockObjectProduction));
  t.true(isDoc({}));
  t.true(isDoc({ a: null }));
  t.true(isDoc({ a: [null] }));
  t.true(isDoc({ date: '2010.09.31' }));
  t.true(isDoc({ date: {} }));
  t.true(isDoc({ a: '反復回転時計' }));
  t.true(isDoc({ a: 'a\\null\\undefined' }));
  t.true(isDoc({ _id: 1, a: { b: [{ c: [undefined] }] } }));

  t.end();
});
