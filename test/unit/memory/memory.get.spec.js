const test = require('tape');

const { mockObjectSimple, mockObjectComplex } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[memory.get] should return document', t => {
  const memory = new Memory();

  memory._docs.set(mockObjectSimple._id, mockObjectSimple);

  t.deepEqual(memory.get(mockObjectSimple._id), mockObjectSimple, 'returns doc');

  t.end();
});

test('[memory.get] should return null if document does not exist', t => {
  const memory = new Memory();

  t.equal(memory.get(mockObjectSimple._id), null, 'returns null');

  t.end();
});

test('[memory.get] is immutable', t => {
  const memory = new Memory();

  memory.set(mockObjectComplex);
  mockObjectComplex.c[0].d = 'Immutable';

  t.notEqual(memory.get(mockObjectComplex._id).c[0].d, 'Immutable', 'immutable');

  t.end();
});
