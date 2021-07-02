import deepEqual from 'fast-deep-equal';
import * as dot from '@chronocide/dot-obj';

// Errors
import { INVALID_OPERATOR } from './errors';

// Types
import {
  Update,
  Query,
  DocBase,
  Doc,
  DocInternal,
  Operators,
  Modifiers,
  Projection,
  Tags
} from './types';

// Base
export const isObject = (object: unknown): object is object => object !== null && !Array.isArray(object) && typeof object === 'object';
export const isEmptyObject = (object: unknown): object is {} => isObject(object) && Object.keys(object).length === 0;
export const isId = (_id: unknown): _id is string => typeof _id === 'string' && _id.length > 0;
export const isIdArray = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.every(isId);
export const isDocBase = (docBase: unknown): docBase is DocBase => isObject(docBase);
export const isTag = (key: unknown): key is keyof Operators | keyof Modifiers | keyof Tags => typeof key === 'string' && key[0] === '$';

// Operators
export const hasTag = ([key, value]: [string, unknown]) => isTag(key) && value !== undefined;
export const hasDot = ([key, value]: [string, unknown]) => key.includes('.') && value !== undefined;
export const hasOperators = (update: object) => Object.entries(update).some(hasTag);
export const hasMixedOperators = (update: object) =>
  hasOperators(update) &&
  !Object.entries(update).every(hasTag);

// Leaf-DB
export const isDoc = (doc: unknown): doc is Doc => {
  if (!isObject(doc)) return false;
  return dot.every(doc, entry => !hasTag(entry) && !hasDot(entry));
};

export const isDocStrict = <T extends Doc>(doc: unknown): doc is DocInternal<T> => {
  if (!isDoc(doc)) return false;
  if (!doc._id) return false;
  return true;
};

export const isQuery = (query: unknown): query is Query => {
  if (!isDocBase(query)) return false;
  if (query.$deleted) return false;
  return true;
};

export const isUpdate = (update: unknown): update is Update => {
  if (!isDocBase(update)) return false;
  if (isDocStrict(update)) return false;
  if (hasMixedOperators(update)) return false;
  if (!hasOperators(update) && !isDoc(update)) return false;
  if (
    hasOperators(update) &&
    Object.values(update).some(value => {
      if (!isObject(value) && !Array.isArray(value)) return false;
      return dot.some(value, entry => {
        if (hasTag(entry)) return true;
        if (entry[0] === '_id') return true;
        if (isDocBase(entry[1]) && hasOperators(entry[1])) return true;
        if (isDocBase(entry[1]) && entry[1]._id) return true;
        return false;
      });
    })
  ) return false;
  return true;
};

export const isProjection = (projection: unknown[]): projection is Projection => projection
  .every(key => typeof key === 'string' && !isTag(key));

export const isModifier = <T extends keyof Modifiers>(modifier: T, value: unknown): value is Modifiers[T] => {
  switch (modifier) {
    case '$push':
    case '$set':
      return isDocBase(value);
    case '$add':
      if (!isObject(value)) return false;
      if (dot.some(value, entries => typeof entries[1] !== 'number')) return false;
      return true;
    default:
      return false;
  }
};

export const isOperator = <T extends keyof Operators>(operator: T, value: unknown): value is Operators[T] => {
  switch (operator) {
    case '$gt':
    case '$gte':
    case '$lt':
    case '$lte':
      if (!isObject(value)) return false;
      if (dot.some(value, entries => typeof entries[1] !== 'number')) return false;
      return true;
    case '$string':
    case '$stringStrict':
      if (!isObject(value)) return false;
      if (dot.some(value, entries => typeof entries[1] !== 'string')) return false;
      return true;
    case '$includes':
    case '$not':
      return isDocBase(value);
    case '$keys':
      if (!Array.isArray(value)) return false;
      return value.every(i => typeof i === 'string');
    case '$or':
      if (!Array.isArray(value)) return false;
      return value.every(isQuery);
    default:
      return false;
  }
};

export const isQueryMatch = <T extends DocBase>(doc: T, query: Query): boolean => {
  if (isEmptyObject(query)) return true;

  const isMatchMath = (match: (x: number, y: number) => boolean) => (value: Record<string, number>) => Object
    .entries(value)
    .every(entry => {
      const current = dot.get(doc, entry[0]);
      if (typeof current !== 'number') return false;
      return match(current, entry[1]);
    });

  const isMatchString = (match: (a: string, b: string) => boolean) => (value: Record<string, string>) => Object
    .entries(value)
    .every(entry => {
      const current = dot.get(doc, entry[0]);
      if (typeof current !== 'string') return false;
      return match(current, entry[1]);
    });

  return Object
    .entries(query)
    .every(entry => {
      const operator = entry[0];
      const value = entry[1];

      if (!isTag(operator[0])) return deepEqual(dot.get(doc, operator), value);
      switch (operator) {
        case '$gt':
          if (!isOperator(operator, value)) return false;
          return isMatchMath((x, y) => x > y)(value);
        case '$gte':
          if (!isOperator(operator, value)) return false;
          return isMatchMath((x, y) => x >= y)(value);
        case '$lt':
          if (!isOperator(operator, value)) return false;
          return isMatchMath((x, y) => x < y)(value);
        case '$lte':
          if (!isOperator(operator, value)) return false;
          return isMatchMath((x, y) => x <= y)(value);
        case '$string':
          if (!isOperator(operator, value)) return false;
          return isMatchString((a, b) => a.toLocaleLowerCase().includes(b.toLocaleLowerCase()))(value);
        case '$stringStrict':
          if (!isOperator(operator, value)) return false;
          return isMatchString((a, b) => a.includes(b))(value);
        case '$includes':
          if (!isOperator(operator, value)) return false;
          return Object.entries(value).every(e => {
            const current = dot.get(doc, e[0]);
            if (!Array.isArray(current)) return false;
            return current.some(item => deepEqual(item, e[1]));
          });
        case '$not':
          if (!isOperator(operator, value)) return false;
          return Object.entries(value).every(e => !deepEqual(dot.get(doc, e[0]), e[1]));
        case '$keys':
          if (!isOperator(operator, value)) return false;
          return value.every(key => dot.get(doc, key) !== undefined);
        case '$or':
          if (!isOperator(operator, value)) return false;
          return value.some(q => isQueryMatch(doc, q));
        default:
          throw new Error(INVALID_OPERATOR(operator));
      }
    });
};
