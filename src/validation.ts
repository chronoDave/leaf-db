import deepEqual from 'fast-deep-equal';
import * as dot from '@chronocide/dot-obj';

import {
  Doc,
  Modifiers,
  Operators,
  Query,
  Update
} from './types';
import { INVALID_OPERATOR } from './errors';

// Primitive guards
export const isObject = (x: unknown): x is object =>
  x !== null &&
  !Array.isArray(x) &&
  typeof x === 'object';
export const isObjectEmtpy = (x: object) =>
  Object.keys(x).length === 0;
export const isId = (x: string) =>
  x.length > 0;
export const isTag = (x: string) =>
  x[0] === '$';

// Primitive validators
export const hasTag = ([key, value]: [string, unknown]) =>
  isTag(key) &&
  value !== undefined;
export const hasDot = ([key, value]: [string, unknown]) =>
  key.includes('.') &&
  value !== undefined;
export const hasKey = (entry: [string, unknown], key: string) =>
  entry[0] === key &&
  entry[1] !== undefined;

// Leaf-DB guards
export const isDoc = <T extends Record<string, unknown>>(x: unknown): x is T =>
  isObject(x) &&
  dot.every(x, entry => (
    !hasDot(entry) &&
    !hasTag(entry)
  ));
export const isDocPrivate = <T extends Record<string, unknown>>(x: unknown): x is Doc<T> =>
  isDoc(x) &&
  typeof x._id === 'string' &&
  x._id.length > 0;
export const isQuery = (x: unknown): x is Query =>
  isObject(x) &&
  dot.every(x, entry => !hasKey(entry, '$deleted'));
export const isModifier = (x: unknown): x is Partial<Modifiers> =>
  isObject(x) &&
  Object.keys(x).length > 0 &&
  dot.every(x, entry => (
    !hasKey(entry, '$deleted') &&
    !hasKey(entry, '_id')
  )) &&
  Object.entries(x).every(hasTag);
export const isUpdate = <T>(x: unknown): x is Update<T> =>
  isObject(x) &&
  dot.every(x, entry => (
    !hasKey(entry, '_id') &&
    !hasKey(entry, '$deleted')
  )) &&
  (Object.entries(x).every(hasTag) || !Object.entries(x).some(hasTag)) &&
  Object.entries(x).every(entry => typeof entry[1] === 'object' ? !dot.some(entry[1], hasTag) : true);

// Leaf-DB validators
export const hasOperator = <T extends keyof Operators>(
  operator: T,
  x: unknown
): x is Operators[T] => {
  switch (operator) {
    case '$gt':
    case '$gte':
    case '$lt':
    case '$lte':
      if (!isObject(x)) return false;
      if (dot.some(x, entry => typeof entry[1] !== 'number')) return false;
      return true;
    case '$string':
    case '$stringStrict':
      if (!isObject(x)) return false;
      if (dot.some(x, entry => typeof entry[1] !== 'string')) return false;
      return true;
    case '$includes':
    case '$not':
      return isObject(x);
    case '$keys':
      if (!Array.isArray(x)) return false;
      return x.every(i => typeof i === 'string');
    case '$or':
      if (!Array.isArray(x)) return false;
      return x.every(isQuery);
    default:
      return false;
  }
};

export const hasModifier = <T extends keyof Modifiers>(
  modifier: T,
  x: unknown
): x is Modifiers[T] => {
  switch (modifier) {
    case '$push':
    case '$set':
      if (!isObject(x)) return false;
      return true;
    case '$add':
      if (!isObject(x)) return false;
      if (dot.some(x, entry => typeof entry[1] !== 'number')) return false;
      return true;
    default:
      return false;
  }
};

// Query
export const isQueryMatch = <T extends Record<string, unknown>>(
  doc: Doc<T>,
  query: Query
): boolean => {
  if (isObjectEmtpy(query)) return true;

  const isMatchMath = (
    match: (x: number, y: number) => boolean
  ) => (value: Record<string, number>) => Object
    .entries(value)
    .every(entry => {
      const cur = dot.get(doc, entry[0]);
      if (typeof cur !== 'number') return false;
      return match(cur, entry[1]);
    });

  const isMatchString = (
    match: (x: string, y: string) => boolean
  ) => (value: Record<string, string>) => Object
    .entries(value)
    .every(entry => {
      const cur = dot.get(doc, entry[0]);
      if (typeof cur !== 'string') return false;
      return match(cur, entry[1]);
    });

  return Object
    .entries(query)
    .every(([operator, value]) => {
      if (!isTag(operator)) return deepEqual(dot.get(doc, operator), value);
      switch (operator) {
        case '$gt':
          if (!hasOperator(operator, value)) return false;
          return isMatchMath((x, y) => x > y)(value);
        case '$gte':
          if (!hasOperator(operator, value)) return false;
          return isMatchMath((x, y) => x >= y)(value);
        case '$lt':
          if (!hasOperator(operator, value)) return false;
          return isMatchMath((x, y) => x < y)(value);
        case '$lte':
          if (!hasOperator(operator, value)) return false;
          return isMatchMath((x, y) => x <= y)(value);
        case '$string':
          if (!hasOperator(operator, value)) return false;
          return isMatchString((a, b) => (
            a.toLocaleLowerCase().includes(b.toLocaleLowerCase())
          ))(value);
        case '$stringStrict':
          if (!hasOperator(operator, value)) return false;
          return isMatchString((a, b) => a.includes(b))(value);
        case '$includes':
          if (!hasOperator(operator, value)) return false;
          return Object.entries(value).every(e => {
            const current = dot.get(doc, e[0]);
            if (!Array.isArray(current)) return false;
            return current.some(item => deepEqual(item, e[1]));
          });
        case '$not':
          if (!hasOperator(operator, value)) return false;
          return Object.entries(value).every(e => !deepEqual(dot.get(doc, e[0]), e[1]));
        case '$keys':
          if (!hasOperator(operator, value)) return false;
          return value.every(key => dot.get(doc, key) !== undefined);
        case '$or':
          if (!hasOperator(operator, value)) return false;
          return value.some(q => isQueryMatch(doc, q));
        default:
          throw new Error(INVALID_OPERATOR(operator));
      }
    });
};
