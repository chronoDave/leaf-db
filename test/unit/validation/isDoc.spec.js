const test = require('tape');

const { isDoc } = require('../../build/validation');

test('[isDoc] should return false if doc is invalid', t => {
  t.false(isDoc({ _id: undefined }), '_id undefined');
  t.false(isDoc({ _id: { a: undefined } }), '_id object');
  t.false(isDoc({ _id: [{ a: undefined }] }), '_id array');

  t.end();
});

test('[isDoc] should return true is doc is valid', t => {
  t.true(isDoc({ _id: '3' }));

  t.end();
});
