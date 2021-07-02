import * as dot from '@chronocide/dot-obj';

// Errors
import { INVALID_MODIFIER, INVALID_PROJECTION, NOT_ARRAY } from './errors';

// Types
import { Doc, Projection, Update } from './types';
import { isProjection, isTag, isObject } from './validation';

/**
 * TODO:
 *  - Add modifier check (and cast)
 *  - Throw error if invalid modifiers
 *  - Add modifier validation similar to validation.ts
 */

export const modify = <T extends Doc>(doc: T, update: Update): T => {
  for (let i = 0, updateEntries = Object.entries(update); i < updateEntries.length; i += 1) {
    const [modifier, fields] = updateEntries[i];

    for (let j = 0, fieldEntries = Object.entries(isObject(fields) ? fields : {}); j < fieldEntries.length; j += 1) {
      const [key, value] = fieldEntries[j];

      switch (modifier) {
        case '$add': {
          const cur = dot.get(doc, key);
          if (typeof cur !== 'number' || typeof value !== 'number') return doc;
          return dot.set(doc, key, cur + value);
        }
        case '$set':
          if (key === '_id') throw new Error(`Cannot modify field _id: ${update}`);
          if (isTag(key)) throw new Error(`Cannot add operator: ${update}`);
          return dot.set(doc, key, value);
        case '$push': {
          const cur = dot.get(doc, key);
          if (!Array.isArray(cur)) return doc;
          return dot.set(doc, key, [...cur, value]);
        }
        default:
          throw new Error(INVALID_MODIFIER(modifier));
      }
    }
  }

  return doc;
};

export const project = <T extends Doc>(doc: T, projection?: Projection): Partial<T> => {
  if (projection === undefined) return doc;

  if (!Array.isArray(projection)) throw new Error(NOT_ARRAY('projection', projection));

  if (projection.length === 0) return {};

  if (!isProjection(projection)) throw new Error(INVALID_PROJECTION(projection));

  return projection
    .reduce((acc, key) => dot.set(acc, key, dot.get(doc, key)), {});
};
