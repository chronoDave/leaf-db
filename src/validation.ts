import deepEqual from 'fast-deep-equal';
import { get, some } from '@chronocide/dot-obj';

// Types
import {
  Query,
  ValueOf,
  Update,
  Doc,
  Operators
} from './types';

// Basic
export const isObject = (any: unknown) => any !== null && !Array.isArray(any) && typeof any === 'object';
export const isEmptyObject = (object: object) => Object.keys(object).length === 0;
export const isId = (any: unknown) => typeof any === 'string' && any.length > 0;

export const isOperatorMatch = (doc: Doc, operator: string, query: ValueOf<Operators>) => {
  const matchMath = (fn: (current: number, original: number) => boolean) => {
    if (!isObject(query)) return false;
    return Object.entries(query).every(([key, value]) => {
      if (typeof value !== 'number') return false;
      const original = get(doc, key);
      if (typeof original !== 'number') return false;
      return fn(value, original);
    });
  };

  const matchObject = (fn: (key: string, value: unknown) => boolean) => {
    if (!isObject(query)) return false;
    return Object.entries(query).every(([key, value]) => {
      if (typeof key !== 'string') return false;
      return fn(key, value);
    });
  };

  const matchString = (fn: (current: string, original: string) => boolean) => {
    if (!isObject(query)) return false;
    return Object.entries(query).every(([key, value]) => {
      if (typeof value !== 'string') return false;
      const original = get(doc, key);
      if (typeof original !== 'string') return false;
      return fn(value, original);
    });
  };

  switch (operator) {
    case '$gt':
      return matchMath((value, original) => original > value);
    case '$gte':
      return matchMath((value, original) => original >= value);
    case '$lt':
      return matchMath((value, original) => original < value);
    case '$lte':
      return matchMath((value, original) => original <= value);
    case '$not':
      return matchObject((key, value) => !deepEqual(get(doc, key), value));
    case '$keys':
      if (!Array.isArray(query)) return false;
      return query.every(key => {
        if (typeof key !== 'string') return false;
        return get(doc, key) !== undefined;
      });
    case '$includes':
      return matchObject((key, value) => {
        const original = get(doc, key);
        if (!Array.isArray(original)) return false;
        return original.some(item => deepEqual(item, value));
      });
    case '$string':
      return matchString((value, original) => original.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    case '$stringStrict':
      return matchString((value, original) => original.includes(value));
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
};

export const isQueryMatch = (doc: Doc, query: Query): boolean => Object
  .entries(query)
  .every(([key, value]) => {
    if (key === '$or') {
      if (!Array.isArray(value)) return false;
      return value.some(nestedQuery => {
        if (!isObject(nestedQuery)) return false;
        return isQueryMatch(doc, nestedQuery as Query);
      });
    }
    if (key[0] === '$') return isOperatorMatch(doc, key, value);
    return deepEqual(get(doc, key), value);
  });

export const isInvalidDoc = (doc: Partial<Doc>) => some(doc, ([key, value]) => {
  if (key[0] === '$') return true;
  if (key.includes('.')) return true;
  if (value === undefined) return true;
  return false;
});

export const hasModifiers = (update: Update) => Object
  .keys(update)
  .some(key => key[0] === '$');

export const hasMixedModifiers = (update: Update) => (
  hasModifiers(update) &&
  Object.keys(update).some(key => key[0] !== '$')
);
