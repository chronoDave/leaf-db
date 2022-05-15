const test = require('tape');

const { mockObjectSimple } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[get] should return document', t => {
  const memory = new Memory();

  memory._docs.set(mockObjectSimple._id, mockObjectSimple);

  t.deepEqual(memory.get(mockObjectSimple._id), mockObjectSimple);

  t.end();
});

test('[get] should return null if document does not exist', t => {
  const memory = new Memory();

  t.equal(memory.get(mockObjectSimple._id), null);

  t.end();
});
