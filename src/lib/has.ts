import * as is from './is.ts';

export const tag = ([k, v]: [string, unknown]) =>
  is.tag(k) &&
  v !== undefined;

export const tagDeep = ([k, v]: [string, unknown]): boolean =>
  v !== null && typeof v === 'object' ?
    Object.entries(v).some(tagDeep) :
    tag([k, v]);

export const key = (entry: [string, unknown], k: string) =>
  entry[0] === k &&
  entry[1] !== undefined;
