export const MEMORY_MODE = (fn: string) => `Tried to call '${fn}()' in memory mode`;
export const DUPLICATE_DOC = (doc: { _id: string }) => `Doc already exists with _id: ${doc._id}`;
export const MISSING_FD = (fn: string) => `Cannot call '${fn}()' if file is not opened`;

const INVALID = (param: string) => (value: unknown) => `Invalid ${param}: ${JSON.stringify(value)}`;
export const INVALID_DOC = INVALID('doc');
export const INVALID_MODIFIER = INVALID('modifier');
