import deepEqual from 'fast-deep-equal';
import * as dot from '@chronocide/dot-obj';

// Types
import { Query, DocBase } from './types';

// Basic
export const isObject = (x: any) => x !== null && !Array.isArray(x) && typeof x === 'object';
export const isEmptyObject = (object: object) => Object.keys(object).length === 0;
export const isId = (x: any) => typeof x === 'string' && x.length > 0;

// Query
export const isQueryMatch = <T extends DocBase>(doc: T, query: Query): boolean => {
  if (isEmptyObject(query)) return true;

  const isMatchBase = <Q>(match: (entries: [string, T]) => boolean) => (value: Q) => {
    if (!isObject(value)) return false;
    return Object.entries(value).every(match);
  };

  const isMatchMath = (match: (current: number, value: number) => boolean) => isMatchBase(([key, value]) => {
    if (typeof value !== 'number') return false;
    const current = dot.get(doc, key);
    if (typeof current !== 'number') return false;
    return match(current, value);
  });

  const isMatchString = (match: (current: string, value: string) => boolean) => isMatchBase(([key, value]) => {
    if (typeof value !== 'string') return false;
    const current = dot.get(doc, key);
    if (typeof current !== 'string') return false;
    return match(current, value);
  });

  return Object
    .entries(query)
    .every(entry => {
      const operator = entry[0];
      const value = entry[1];

      if (operator[0] !== '$') return deepEqual(dot.get(doc, operator), value);
      switch (operator) {
        case '$or':
          if (!Array.isArray(value)) return false;
          return value.some(orQuery => {
            if (!isObject(orQuery)) return false;
            return isQueryMatch(doc, orQuery as Query);
          });
        case '$keys':
          if (!Array.isArray(value)) return false;
          return value.every(key => {
            if (typeof key !== 'string') return false;
            return dot.get(doc, key) !== undefined;
          });
        case '$includes':
          return isMatchBase(match => {
            const cur = dot.get(doc, match[0]);
            if (!Array.isArray(cur)) return false;
            return cur.some(item => deepEqual(item, match[1]));
          })(value);
        case '$gt':
          return isMatchMath((x, y) => x > y)(value);
        case '$gte':
          return isMatchMath((x, y) => x >= y)(value);
        case '$lt':
          return isMatchMath((x, y) => x < y)(value);
        case '$lte':
          return isMatchMath((x, y) => x <= y)(value);
        case '$not':
          return isMatchBase(match => !deepEqual(dot.get(doc, match[0]), match[1]))(value);
        case '$string':
          return isMatchString((a, b) => a.toLocaleLowerCase().includes(b.toLocaleLowerCase()))(value);
        case '$stringStrict':
          return isMatchString((a, b) => a.includes(b))(value);
        default:
          throw new Error(`Invalid operator: ${operator}`);
      }
    });
};

// Advanced
const isValidDocBase = ([key, value]: [string, any]) => {
  if (key[0] === '$') return false;
  if (key.includes('.')) return false;
  if (value === undefined) return false;
  return true;
};

const isValidOperator = (value: any) => {
  if (value === undefined) return false;
  if (typeof value === 'object') return dot.every(value, isValidDocBase);
  return true;
};

export const hasOperators = (update: DocBase) => Object
  .keys(update)
  .some(key => key[0] === '$');

export const hasMixedOperators = (update: DocBase) => (
  hasOperators(update) &&
  Object.keys(update).some(key => key[0] !== '$')
);

export const isValidDoc = (doc: DocBase, strict?: boolean) => {
  if (!isObject(doc)) return false;
  if (strict && !isId(doc._id)) return false;
  return dot.every(doc, isValidDocBase);
};

export const isValidUpdate = (update: DocBase) => {
  if (!isObject(update)) return false;
  if (dot.some(update, ([key]) => key === '_id')) return false;
  if (hasMixedOperators(update)) return false;
  if (!hasOperators(update) && !isValidDoc(update)) return false;
  if (hasOperators(update) && !Object.values(update).every(isValidOperator)) return false;
  return true;
};
