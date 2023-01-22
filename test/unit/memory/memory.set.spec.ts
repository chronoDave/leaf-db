import test from 'tape';

import Memory from '../../../src/memory';
import { data } from './fixture';

test('[memory.set] sets document', t => {
  const memory = new Memory();

  memory.set(data);

  // @ts-expect-error: Access private
  t.deepEqual(memory._docs.values().next().value, data, 'sets doc');

  t.end();
});

test('[memory.set] indexes by `_id`', t => {
  const memory = new Memory();

  memory.set(data);

  // @ts-expect-error: Access private
  t.true(memory._docs.has(data._id), 'indexes by _id');

  t.end();
});
