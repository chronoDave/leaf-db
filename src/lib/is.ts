import deepEqual from 'fast-deep-equal';

import * as has from './has.ts';

export const tag = (x: string): x is `$${string}` =>
  x.startsWith('$');

export type Json =
  string |
  number |
  boolean |
  null |
  Json[] |
  { [key: string]: Json };

export type JsonObject = Record<string, Json>;

export const object = (x: unknown): x is JsonObject =>
  x !== null &&
  !Array.isArray(x) &&
  typeof x === 'object';

export type Draft = { _id?: string } & {
  [key: string]: Json;
  [key: `$${string}`]: never;
  [key: `__${string}`]: never;
};

export const draft = <T extends Draft>(x: unknown): x is T =>
  object(x) &&
  !Object.entries(x).some(has.tagDeep);

export type Doc<T extends Draft> = T & {
  readonly _id: string;
  readonly __deleted?: boolean;
};

export const doc = <T extends Draft>(x: unknown): x is Doc<T> =>
  draft(x) &&
  typeof x._id === 'string' &&
  x._id.length > 0;

export type Operators = {
  // Number
  $gt: number;
  $gte: number;
  $lt: number;
  $lte: number;
  // Text
  $text: string;
  $regex: RegExp;
  // Array
  $has: Json;
  $size: number;
  // Logic
  $not: Json;
};

export type Query<T> = Partial<{
  [K in keyof T]: T[K] extends JsonObject ?
    Query<T[K]> :
    T[K] | Partial<Operators>
}>;

export const queryMatch = <T extends JsonObject>(
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
      if (object(doc) && !(key in doc) && !tag(key)) return false;
      const x = object(doc) ? doc[key] : doc;

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
      if (!object(y)) return x === y;

      // { [string]: Object }
      return queryMatch(x, y);
    });
};
