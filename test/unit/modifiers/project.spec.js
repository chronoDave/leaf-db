const test = require('tape');

const { project } = require('../../build/modifiers');

// Utils
const { mockObjectProduction } = require('../_utils');

test('[project] should throw error if projection is not an array if defined', t => {
  const invalidTypes = [1, true, () => null, 'invalid', {}];

  for (let i = 0; i < invalidTypes.length; i += 1) {
    try {
      project(mockObjectProduction, invalidTypes[i]);
      t.fail(`Expected to throw: ${invalidTypes[i]}, ${i}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[project] should throw error if projection contains invalid keys', t => {
  const invalidKeys = [1, null, undefined, true, () => null, false, '$key'];

  for (let i = 0; i < invalidKeys.length; i += 1) {
    try {
      project(mockObjectProduction, [invalidKeys[i]]);
      t.fail(`Expected to throw: ${invalidKeys[i]}, ${i}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[project] should return object is projection is empty', t => {
  t.deepEqual(
    project(mockObjectProduction),
    mockObjectProduction
  );

  t.end();
});

test('[project] should return empty object is projection is an empty array', t => {
  t.deepEqual(
    project(mockObjectProduction, []),
    {}
  );

  t.end();
});

test('[project] should only return the values provided in projection', t => {
  t.deepEqual(
    project(mockObjectProduction, ['file', 'metadata.date']),
    {
      file: mockObjectProduction.file,
      metadata: {
        date: mockObjectProduction.metadata.date
      }
    }
  );

  t.end();
});
