const test = require('tape');

const { isDocPrivate } = require('../../build/validation');

test('[isDocPrivate] should return false if doc is invalid', t => {
  t.false(isDocPrivate({ _id: undefined }), '_id undefined');
  t.false(isDocPrivate({ _id: { a: undefined } }), '_id object');
  t.false(isDocPrivate({ _id: [{ a: undefined }] }), '_id array');

  t.end();
});

test('[isDocPrivate] should return true is doc is valid', t => {
  t.true(isDocPrivate({ _id: '3' }));

  t.end();
});
