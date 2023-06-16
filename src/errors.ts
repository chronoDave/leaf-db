export const MEMORY_MODE = (fn: string) => `Tried to call '${fn}()' in memory mode`;
export const DUPLICATE_DOC = (doc: { _id: string }) => `Doc already exists: ${doc._id}`;
export const DUPLICATE_DOCS = 'Docs contains dupicates';
export const NOT_ABSOLUTE = 'Path is not absolute';
export const MISSING_FD = (fn: string) => `Cannot call '${fn}()' if file is not opened`;

const INVALID = (param: string) => (value: unknown) => `Invalid ${param}: ${JSON.stringify(value)}`;
export const INVALID_DOC = INVALID('doc');
export const INVALID_QUERY = INVALID('query');
export const INVALID_UPDATE = INVALID('update');
export const INVALID_OPERATOR = INVALID('operator');
export const INVALID_MODIFIER = INVALID('modifier');

const NOT = (type: string) => (value: unknown) => `Invalid value '${JSON.stringify(value)} (${typeof value})', expected type '${type}'`;
export const NOT_ARRAY = NOT('Array');
export const NOT_NUMBER = NOT('Number');
