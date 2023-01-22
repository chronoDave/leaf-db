import test from 'tape';

import Memory from '../../../src/memory';
import { data } from './fixture';

test('[memory.get] should return document', t => {
  const memory = new Memory();

  // @ts-expect-error: Access private
  memory._docs.set(data._id, data);

  t.deepEqual(memory.get(data._id), data, 'returns doc');

  t.end();
});

test('[memory.get] should return null if document does not exist', t => {
  const memory = new Memory();

  t.equal(memory.get(data._id), null, 'returns null');

  t.end();
});
