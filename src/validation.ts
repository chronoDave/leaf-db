import deepEqual from 'fast-deep-equal';
import * as dot from '@chronocide/dot-obj';

// Types
import {
  Query,
  ValueOf,
  Update,
  Doc,
  Operators
} from './types';

// Basic
export const isObject = (x: any) => x !== null && !Array.isArray(x) && typeof x === 'object';
export const isEmptyObject = (object: object) => Object.keys(object).length === 0;
export const isId = (x: any) => typeof x === 'string' && x.length > 0;

// Operators
const isMatchBase = (match: (entries: [string, unknown]) => boolean) => (query: ValueOf<Operators>) => {
  if (!isObject(query)) return false;
  return Object.entries(query).every(match);
};

const isMatchMath = (doc: Doc, match: (current: number, value: number) => boolean) => isMatchBase(([key, value]) => {
  if (typeof value !== 'number') return false;
  const current = dot.get(doc, key);
  if (typeof current !== 'number') return false;
  return match(current, value);
});

const isMatchString = (doc: Doc, match: (current: string, value: string) => boolean) => isMatchBase(([key, value]) => {
  if (typeof value !== 'string') return false;
  const current = dot.get(doc, key);
  if (typeof current !== 'string') return false;
  return match(current, value);
});

export const isQueryMatch = (doc: Doc, rootQuery: Query): boolean => Object
  .entries(rootQuery)
  .every(([operator, query]) => {
    if (operator[0] !== '$') return deepEqual(dot.get(doc, operator), query);
    switch (operator) {
      case '$or':
        if (!Array.isArray(query)) return false;
        return query.some(nestedQuery => {
          if (!isObject(nestedQuery)) return false;
          return isQueryMatch(doc, nestedQuery as Query);
        });
      case '$keys':
        if (!Array.isArray(query)) return false;
        return query.every(key => {
          if (typeof key !== 'string') return false;
          return dot.get(doc, key) !== undefined;
        });
      case '$includes':
        return isMatchBase(([key, value]) => {
          const current = dot.get(doc, key);
          if (!Array.isArray(current)) return false;
          return current.some(item => deepEqual(item, value));
        })(query);
      case '$gt':
        return isMatchMath(doc, (x, y) => x > y)(query);
      case '$gte':
        return isMatchMath(doc, (x, y) => x >= y)(query);
      case '$lt':
        return isMatchMath(doc, (x, y) => x < y)(query);
      case '$lte':
        return isMatchMath(doc, (x, y) => x <= y)(query);
      case '$not':
        return isMatchBase(([key, value]) => !deepEqual(dot.get(doc, key), value))(query);
      case '$string':
        return isMatchString(doc, (x, y) => x.toLocaleLowerCase().includes(y.toLocaleLowerCase()))(query);
      case '$stringStrict':
        return isMatchString(doc, (x, y) => x.includes(y))(query);
      default:
        throw new Error(`Invalid operator: ${operator}`);
    }
  });

export const isInvalidDoc = (doc: Partial<Doc>) => dot.some(doc, ([key, value]) => {
  if (key[0] === '$') return true;
  if (key.includes('.')) return true;
  if (value === undefined) return true;
  return false;
});

export const hasOperators = (update: Update) => Object
  .keys(update)
  .some(key => key[0] === '$');

export const hasMixedOperators = (update: Update) => (
  hasOperators(update) &&
  Object.keys(update).some(key => key[0] !== '$')
);
