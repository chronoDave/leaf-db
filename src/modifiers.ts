import * as dot from '@chronocide/dot-obj';

import { INVALID_MODIFIER, INVALID_PROJECTION, NOT_ARRAY } from './errors';
import { KeysOf, Projection, Modifiers } from './types';
import { hasModifier, isTag } from './validation';

const fromDot = (x: string, v: any) => {
  const obj = {} as Record<string, any>;

  let temp = obj;
  x.split('.').forEach((key, i, arr) => {
    if (arr.length === i + 1) {
      temp[key] = v;
    } else {
      temp[key] = {};
      temp = temp[key];
    }
  });

  return obj;
};

export const project = <T extends object, P extends KeysOf<T>>(
  doc: T,
  projection?: P
) => {
  if (!projection) return doc;
  if (!Array.isArray(projection)) throw new Error(NOT_ARRAY(projection));
  if (projection.some(x => typeof x !== 'string' || isTag(x))) throw new Error(INVALID_PROJECTION(projection));
  return projection.reduce((acc, key) => {
    const k = `${key}`;
    const v = k.includes('.') ?
      fromDot(k, dot.get(doc, k)) :
      { [k]: dot.get(doc, k) };

    return ({
      ...acc,
      ...v
    });
  // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
  }, {} as Projection<T, P>);
};

export const modify = <T extends object>(doc: T, modifiers: Partial<Modifiers>): T => {
  Object.entries(modifiers).forEach(([modifier, value]) => {
    switch (modifier) {
      case '$push':
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach(entry => {
          const cur = dot.get(doc, entry[0]);
          if (Array.isArray(cur)) dot.set(doc, entry[0], [...cur, entry[1]]);
        });
        break;
      case '$set':
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach(entry => dot.set(doc, entry[0], entry[1]));
        break;
      case '$add':
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach(entry => {
          const cur = dot.get(doc, entry[0]);
          if (typeof cur === 'number') dot.set(doc, entry[0], cur + entry[1]);
        });
        break;
      default:
        throw new Error(INVALID_MODIFIER(modifier));
    }
  });

  return doc;
};
