export type Json =
  string |
  number |
  boolean |
  null |
  Json[] |
  { [key: string]: Json };

export type Draft = Record<string, Json> & {
  [key: `$${string}`]: never;
  [key: `__${string}`]: never;
};

export type Doc<T extends Draft> = T & { readonly _id: string };

export const isObject = (x: unknown): x is Record<string, unknown> =>
  x !== null &&
  !Array.isArray(x) &&
  typeof x === 'object';

export const hasModifier = (x: object): boolean =>
  Object.entries(x).some(([k, v]) => {
    if (k.startsWith('$')) return true;
    return isObject(v) ? hasModifier(v) : false;
  });

export default <T extends Draft>(x: string): Doc<T> => {
  const raw = JSON.parse(x);

  if (!isObject(raw)) throw new Error('Not an object');
  if (!('_id' in raw)) throw new Error('Missing _id');
  if (hasModifier(raw)) throw new Error('Has modifier');

  return raw as Doc<T>;
};
