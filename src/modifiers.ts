import objectGet from 'lodash.get';
import objectSet from 'lodash.set';

// Types
import { Projection, NewDoc, Update } from './types';

const modifiers = {
  add: (object: object, key: string, value: unknown) => {
    if (
      typeof objectGet(object, key) !== 'number' ||
      typeof value !== 'number' ||
      !objectGet(object, key)
    ) return object;
    return objectSet(object, key, objectGet(object, key) + value);
  },
  set: (object: object, key: string, value: unknown) => objectSet(object, key, value)
};

export const objectModify = (object: object, update: NewDoc | Update) => {
  for (let i = 0, ue = Object.entries(update); i < ue.length; i += 1) {
    const [modifier, fields] = ue[i];

    for (let j = 0, fe = Object.entries(fields || {}); j < fe.length; j += 1) {
      const [key, value] = fe[j];

      switch (modifier) {
        case '$add':
          return modifiers.add(object, key, value);
        case '$set':
          return modifiers.set(object, key, value);
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return object;
};

export const objectProject = (object: NewDoc, projection: Projection) => {
  if (!object) return null;
  if (!projection) return object;

  if (!Array.isArray(projection)) {
    throw new Error(`Invalid projection, must be of type 'Array' or falsy: ${projection}`);
  }

  if (projection.length === 0) return {};

  if (projection.some(key => typeof key !== 'string' || key[0] === '$')) {
    throw new Error(`Invalid projection, contains invalid key: ${projection}`);
  }

  return projection
    .reduce((acc, key) => objectSet(acc, key, objectGet(object, key)), {});
};
