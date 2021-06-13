const test = require('tape');

const { isValidDoc } = require('../../build/validation');

// Utils
const { mockObjectProduction } = require('../_utils');

test('[isValidDoc] should return false if doc is invalid', t => {
  // Strict
  t.false(isValidDoc({ _id: undefined }, true), '_id undefined');
  t.false(isValidDoc({ _id: { a: undefined } }, true), '_id object');
  t.false(isValidDoc({ _id: [{ a: undefined }] }, true), '_id array');

  // Loose
  t.false(isValidDoc({ $field: 2 }), 'operator');
  t.false(isValidDoc({ 'test.field': 2 }), 'dot');
  t.false(isValidDoc({ a: { $field: 2 } }), 'nested operator');
  t.false(isValidDoc({ a: { 'test.field': 2 } }), 'nested dot');
  t.false(isValidDoc({ a: [{ $field: 2 }] }), 'array nested operator');
  t.false(isValidDoc({ a: [{ 'test.field': 2 }] }), 'array nested dot');
  t.false(isValidDoc({ _id: 1, a: { b: [{ c: [undefined] }] } }), 'deep nested undefined');

  t.end();
});

test('[isValidDoc] should return true is doc is valid', t => {
  // Strict
  t.true(isValidDoc({ _id: '3' }));
  // Loose
  t.true(isValidDoc(mockObjectProduction));
  t.true(isValidDoc({}));
  t.true(isValidDoc({ a: null }));
  t.true(isValidDoc({ a: [null] }));
  t.true(isValidDoc({ date: '2010.09.31' }));
  t.true(isValidDoc({ date: {} }));
  t.true(isValidDoc({ a: '反復回転時計' }));
  t.true(isValidDoc({ a: 'a\\null\\undefined' }));

  t.end();
});
