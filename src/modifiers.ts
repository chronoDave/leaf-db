import * as dot from '@chronocide/dot-obj';

// Types
import { Doc, Projection, Update } from './types';

export const docModify = (doc: Doc, update: Update): Doc => {
  for (let i = 0, updateEntries = Object.entries(update); i < updateEntries.length; i += 1) {
    const [modifier, fields] = updateEntries[i];

    for (let j = 0, fieldEntries = Object.entries(fields || {}); j < fieldEntries.length; j += 1) {
      const [key, value] = fieldEntries[j];

      switch (modifier) {
        case '$add': {
          const cur = dot.get(doc, key);
          if (typeof cur !== 'number' || typeof value !== 'number') return doc;
          return dot.set(doc, key, cur + value) as Doc;
        }
        case '$set':
          if (key === '_id') throw new Error(`Cannot modify field _id: ${update}`);
          return dot.set(doc, key, value) as Doc;
        case '$push': {
          const cur = dot.get(doc, key);
          if (!Array.isArray(cur)) return doc;
          return dot.set(doc, key, [...cur, value]) as Doc;
        }
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return doc;
};

export const docProject = (doc: Doc, projection?: Projection): Partial<Doc> => {
  if (!projection) return doc;

  if (!Array.isArray(projection)) {
    throw new Error(`Invalid projection, must be of type 'Array' or falsy: ${projection}`);
  }

  if (projection.length === 0) return {};

  if (projection.some(key => typeof key !== 'string' || key[0] === '$')) {
    throw new Error(`Invalid projection, contains invalid key: ${projection}`);
  }

  return projection
    .reduce((acc, key) => dot.set(acc, key, dot.get(doc, key)) as Partial<Doc>, {});
};
