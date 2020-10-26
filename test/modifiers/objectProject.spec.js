const test = require('tape');

const { objectProject } = require('../../dist/modifiers');

// Utils
const { mockObjectProduction } = require('../_utils');

test('[objectProject] should throw error if projection is not an array if defined', t => {
  const invalidTypes = [1, true, () => null, 'invalid', {}];

  for (let i = 0; i < invalidTypes.length; i += 1) {
    try {
      objectProject(mockObjectProduction, invalidTypes[i]);
      t.fail(`Expected to throw: ${invalidTypes[i]}, ${i}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[objectProject] should throw error if projection contains invalid keys', t => {
  const invalidKeys = [1, null, undefined, true, () => null, false, '$key'];

  for (let i = 0; i < invalidKeys.length; i += 1) {
    try {
      objectProject(mockObjectProduction, [invalidKeys[i]]);
      t.fail(`Expected to throw: ${invalidKeys[i]}, ${i}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[objectProject] should return object is projection is empty', t => {
  t.deepEqual(
    objectProject(mockObjectProduction),
    mockObjectProduction
  );

  t.end();
});

test('[objectProject] should return empty object is projection is an empty array', t => {
  t.deepEqual(
    objectProject(mockObjectProduction, []),
    {}
  );

  t.end();
});

test('[objectProject] should only return the values provided in projection', t => {
  t.deepEqual(
    objectProject(mockObjectProduction, ['file', 'metadata.date']),
    {
      file: mockObjectProduction.file,
      metadata: {
        date: mockObjectProduction.metadata.date
      }
    }
  );

  t.end();
});
