import * as dot from '@chronocide/dot-obj';
import deepEqual from 'fast-deep-equal';

import {
  Doc,
  Draft,
  Modifiers,
  Struct,
  Json,
  Query
} from './types';

// Guards
export const isObject = (x: unknown): x is Struct =>
  x !== null &&
  !Array.isArray(x) &&
  typeof x === 'object';
export const isTag = (x: string): x is `$${string}` =>
  x[0] === '$';

// Validators
export const hasTag = ([key, value]: [string, unknown]) =>
  isTag(key) &&
  value !== undefined;
export const hasKey = (entry: [string, unknown], key: string) =>
  entry[0] === key &&
  entry[1] !== undefined;

// Guards
export const isDraft = <T extends Draft>(x: unknown): x is T =>
  isObject(x) &&
  dot.every(x, entry => !hasTag(entry));
export const isDoc = <T extends Draft>(x: unknown): x is Doc<T> =>
  isDraft(x) &&
  typeof x._id === 'string' &&
  x._id.length > 0;
export const isModifier = (x: unknown): x is Partial<Modifiers> =>
  isObject(x) &&
  Object.keys(x).length > 0 &&
  dot.every(x, entry => !hasKey(entry, '_id')) &&
  Object.entries(x).every(hasTag);

// Validators
export const hasModifier = <T extends keyof Modifiers>(
  modifier: T,
  x: unknown
): x is Modifiers[T] => {
  if (['$push', '$set'].includes(modifier)) return isObject(x);

  if (modifier === '$add') {
    if (!isObject(x)) return false;
    if (dot.some(x, entry => typeof entry[1] !== 'number')) return false;
    return true;
  }

  return false;
};

// Query
export const isQueryMatch = <T extends Struct>(
  doc: T | Json,
  query: Query<T>
): boolean => {
  const isMatchNumber: Record<string, (x: number, y: number) => boolean> = {
    $gt: (x, y) => x > y,
    $gte: (x, y) => x >= y,
    $lt: (x, y) => x < y,
    $lte: (x, y) => x <= y
  };

  return Object
    .entries(query)
    .every(([key, y]) => {
      // Invalid key and not tag
      if ((isObject(doc) && !(key in doc)) && !isTag(key)) return false;
      const x = isObject(doc) ? doc[key] : doc;

      // { [$string]: Json }
      if (key in isMatchNumber) {
        if (typeof x !== 'number' || typeof y !== 'number') return false;
        return isMatchNumber[key](x, y);
      }

      if (key === '$text') {
        if (typeof x !== 'string' || typeof y !== 'string') return false;
        return x.toLocaleLowerCase().includes(y.toLocaleLowerCase());
      }

      if (key === '$regex') {
        if (typeof x !== 'string' || !(y instanceof RegExp)) return false;
        return y.test(x);
      }

      if (key === '$has') {
        if (!Array.isArray(x)) return false;
        return x.some(value => deepEqual(y, value));
      }

      if (key === '$size') {
        if (!Array.isArray(x) || typeof y !== 'number') return false;
        return x.length === y;
      }

      if (key === '$not') return x !== y;

      // { [string]: Array }
      if (Array.isArray(y)) {
        if (!Array.isArray(x) || x.length !== y.length) return false;
        return deepEqual(x, y);
      }

      // { [string]: [string | number | boolean | null] }
      if (!isObject(y)) return x === y;

      // { [string]: Object }
      return isQueryMatch(x, y);
    });
};
