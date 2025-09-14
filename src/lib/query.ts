import type { Draft, Json } from './parse.ts';

import * as fn from './fn.ts';
import { isObject } from './parse.ts';

export type Operator<T extends Record<string, Json>> = {
  [K in keyof T]?: T[K] extends number ?
    Partial<T[K]> | { $gt: number } | { $gte: number } | { $lt: number } | { $lte: number } :
    T[K] extends string ?
      Partial<T[K]> | { $regexp: RegExp } :
      T[K] extends unknown[] ?
        Partial<T[K]> | { $length: number } | { $includes: unknown } :
        T[K] extends Record<string, Json> ?
          Partial<T[K]> | Operator<T[K]> :
          Partial<T[K]>;
};

export type Query<T extends Draft> = {
  $not?: Query<T>;
  $or?: Array<Query<T>>;
  $and?: Array<Query<T>>;
} | Operator<T>;

const match = <T extends Draft>(doc: T) =>
  (query: Query<T>): boolean => {
    if ('$not' in query) return !match(doc)(query.$not as Query<T>);
    if ('$or' in query) return (query.$or as Array<Query<T>>).some(match(doc));
    if ('$and' in query) return (query.$and as Array<Query<T>>).every(match(doc));

    return Object
      .entries(query)
      .every(([key, rule]) => {
        if (isObject(rule)) {
          const keys = Object.keys(rule);
          const operator = keys[0];
          const a = doc[key];
          const b = rule[operator];

          if (operator === '$gt') return (a as number) > (b as number);
          if (operator === '$gte') return (a as number) >= (b as number);
          if (operator === '$lt') return (a as number) < (b as number);
          if (operator === '$lte') return (a as number) <= (b as number);

          if (operator === '$regexp') return (b as RegExp).test(a as string);

          if (operator === '$size') return (a as unknown[]).length === b;
          if (operator === '$includes') return (a as unknown[]).includes(b);

          if (isObject(a)) return match(a as Draft)(rule);
        }

        return fn.equals(doc[key])(rule);
      });
  };

export default match;
