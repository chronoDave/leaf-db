import fs from 'fs';
import path from 'path';

import LeafDB from '../../../src/model';
import datasetMeteorites from '../../assets/nasa_earth-meteorite-landings';

export type DataModel = {
  name: string
  id: string
  nametype: string
  recclass: string
  mass: string
  fall: string
  year: string
  reclat: string
  reclong: string
  geolocation: {
    type: string,
    coordinates: [number, number]
  }
};

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

export const memory = Object.fromEntries(datasetMeteorites.map(x => [x._id, x]));
export const data = datasetMeteorites as unknown as DataModel[];

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
