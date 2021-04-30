import deepEqual from 'fast-deep-equal';
import objectGet from 'lodash.get';

// Types
import {
  Update,
  Value,
  Doc,
  Query
} from './types';

// Utils
import { toArray, objectHas } from './utils';

// Basic
export const isNumber = (any: unknown) => typeof any === 'number';
export const isObject = (any: unknown) => any !== null && !Array.isArray(any) && typeof any === 'object';
export const isEmptyObject = (object: object) => Object.keys(object).length === 0;

const exists = (object: object, keys: Value[]) => keys
  .filter(key => {
    if (typeof key === 'boolean') return false;
    if (typeof key === 'object') return false;
    return objectGet(object, key) !== undefined;
  })
  .length === keys.length;

/**
 * Test if query matches
 * @param {object} query
 * @param {object} doc
 */
export const isQueryMatch = (doc: Doc, query: Query): boolean => Object
  .entries(query)
  .filter(([key, value]) => {
    // Operators
    if (key[0] === '$') {
      switch (key) {
        case '$some':
          if (!Array.isArray(value)) return false;
          if (!value.some(testQuery => isObject(testQuery) && isQueryMatch(doc, testQuery as Query))) return false;
          break;
        default: {
          for (let j = 0, ofe = Object.entries(value); j < ofe.length; j += 1) {
            const [field, testValue] = ofe[j];
            const originalValue = objectGet(doc, field); // Object value

            switch (key) {
              case '$gt':
                if (!originalValue || !isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue > testValue)) return false;
                break;
              case '$gte':
                if (!originalValue || !isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue >= testValue)) return false;
                break;
              case '$lt':
                if (!originalValue || !isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue < testValue)) return false;
                break;
              case '$lte':
                if (!originalValue || !isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue <= testValue)) return false;
                break;
              case '$not':
                if (originalValue === testValue) return false;
                break;
              case '$exists':
                if (!exists(doc, toArray(value))) return false;
                break;
              case '$has':
                if (!Array.isArray(originalValue)) return false;
                if (!originalValue.some(item => deepEqual(item, testValue))) return false;
                break;
              case '$stringStrict':
                if (typeof originalValue !== 'string' || typeof testValue !== 'string') return false;
                if (!originalValue.includes(testValue)) return false;
                break;
              case '$string':
                if (typeof originalValue !== 'string' || typeof testValue !== 'string') return false;
                if (!originalValue.toLowerCase().includes(testValue.toLowerCase())) return false;
                break;
              default:
                throw new Error(`Invalid operator: ${key}`);
            }
          }
        }
      }
    // Regular
    } else if (!deepEqual(objectGet(doc, key), value)) {
      return false;
    }
    // Does match
    return true;
  })
  .length === Object.keys(query).length;

export const isInvalidDoc = (doc: Partial<Doc>) => objectHas(doc, ({ key, value }) => {
  if (key[0] === '$') return true;
  if (key.includes('.')) return true;
  if (value === undefined) return true;
  return false;
});

/** Validate if update has modifier fields */
export const hasModifiers = (update: Update) => objectHas(update, ({ key }) => key[0] === '$');

/** Validate if update has keys and modifiers */
export const hasMixedModifiers = (update: Update) => (
  hasModifiers(update) &&
  Object.keys(update).filter(key => key[0] === '$').length !== Object.keys(update).length
);
