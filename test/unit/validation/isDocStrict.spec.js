const test = require('tape');

const { isDocStrict } = require('../../build/validation');

test('[isDocStrict] should return false if doc is invalid', t => {
  t.false(isDocStrict({ _id: undefined }), '_id undefined');

  t.end();
});

test('[isDocStrict] should return true is doc is valid', t => {
  t.true(isDocStrict({ _id: '3' }));
  t.true(isDocStrict({ _id: { a: undefined } }), '_id object');
  t.true(isDocStrict({ _id: [{ a: undefined }] }), '_id array');

  t.end();
});
