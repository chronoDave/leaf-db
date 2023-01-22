import fs from 'fs';
import path from 'path';

import LeafDB from '../../../src/model';

export type Options = {
  root: string
  name: string
  strict: boolean
  data: any[]
  memory: Record<string, object>
};

export default (options?: Partial<Options>) => {
  let file: string = '';
  const name = options?.name ?? 'test';

  if (options?.root) {
    file = path.resolve(options.root, `${name}.txt`);
    fs.writeFileSync(file, options?.data ? options.data.map(x => JSON.stringify(x)).join('\n') : '');
  }

  const db = new LeafDB({
    strict: options?.strict,
    storage: options?.root ?
      { root: options.root, name } :
      undefined
  });

  if (options?.memory) {
    // @ts-expect-error: Access private
    Object.values(options.memory).map(value => db._memory._docs.set(value._id, value));
  }

  return ({ name, file, db });
};

export const memory = {
  key_1: { _id: 'key_1', data: 'test', values: [1, 2, 3], shared: true },
  key_2: { _id: 'key_2', data: 'not_test', values: [4, 5, 6] },
  key_3: { _id: 'key_3', values: [4, 5, 6], shared: true },
  key_4: { _id: 'key_4', data: { values: [1, 2, 3] } },
  key_5: { _id: 'key_5', data: { label: 'test', values: [{ label: 'test' }] } }
};

export const production = {
  _id: '1',
  a: 1,
  b: [2, null, 3],
  c: [
    {
      d: 'String',
      e: {
        f: null
      }
    },
    {
      g: true,
      h: 'string',
      i: {
        j: [4, null]
      }
    }
  ]
};

export const invalid = [
  1,
  null,
  true,
  '',
  [],
  false,
  { valid: false },
  'valid'
];
