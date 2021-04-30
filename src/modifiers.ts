import objectGet from 'lodash.get';
import objectSet from 'lodash.set';

// Types
import {
  Doc,
  Value,
  Projection,
  Update
} from './types';

const modifiers = {
  add: (doc: Doc, key: string, value: Value) => {
    const cur = objectGet(doc, key);
    if (typeof cur !== 'number' || typeof value !== 'number') return doc;
    return objectSet(doc, key, cur + value);
  },
  set: (doc: Doc, key: string, value: Value) => objectSet(doc, key, value),
  push: (doc: Doc, key: string, value: Value) => {
    const cur = objectGet(doc, key);
    if (!Array.isArray(cur)) return doc;
    return objectSet(doc, key, [...cur, value]);
  }
};

export const docModify = (doc: Doc, update: Update) => {
  for (let i = 0, updateEntries = Object.entries(update); i < updateEntries.length; i += 1) {
    const [modifier, fields] = updateEntries[i];

    for (let j = 0, fieldEntries = Object.entries(fields || {}); j < fieldEntries.length; j += 1) {
      const [key, value] = fieldEntries[j];

      switch (modifier) {
        case '$add':
          return modifiers.add(doc, key, value);
        case '$set':
          return modifiers.set(doc, key, value);
        case '$push':
          return modifiers.push(doc, key, value);
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return doc;
};

export const docProject = (doc: Doc, projection: Projection): Partial<Doc> => {
  if (!projection) return doc;

  if (!Array.isArray(projection)) {
    throw new Error(`Invalid projection, must be of type 'Array' or falsy: ${projection}`);
  }

  if (projection.length === 0) return {};

  if (projection.some(key => typeof key !== 'string' || key[0] === '$')) {
    throw new Error(`Invalid projection, contains invalid key: ${projection}`);
  }

  return projection
    .reduce((acc, key) => objectSet(acc, key, objectGet(doc, key)), {});
};
