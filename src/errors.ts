const toString = (x: unknown) => typeof x === 'object' ?
  JSON.stringify(x) :
  `${x}`;

export const MEMORY_MODE = (fn: string) => `Tried to call '${fn}()' in memory mode`;
export const DUPLICATE_DOC = (doc: { _id: string }) => `Duplicate doc: ${doc._id}`;

const INVALID = (param: string, value: unknown) => `Invalid ${param}: ${toString(value)}`;
export const INVALID_DOC = (doc: unknown) => INVALID('doc', doc);
export const INVALID_ID = (_id: string) => INVALID('_id', _id);
export const INVALID_QUERY = (query: unknown) => INVALID('query', query);
export const INVALID_UPDATE = (update: unknown) => INVALID('update', update);
export const INVALID_OPERATOR = (operator: unknown) => INVALID('operator', operator);
export const INVALID_MODIFIER = (modifier: unknown) => INVALID('modifier', modifier);
export const INVALID_PROJECTION = (projection: unknown) => INVALID('projection', projection);

const NOT = (value: unknown, type: string) => `Invalid value '${toString(value)} (${typeof value})', expected type '${type}'`;
export const NOT_ARRAY = (value: unknown) => NOT(value, 'Array');
export const NOT_NUMBER = (value: unknown) => NOT(value, 'Number');
