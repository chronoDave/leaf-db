import * as dot from '@chronocide/dot-obj';

import { INVALID_MODIFIER, NOT_ARRAY, NOT_NUMBER } from './errors';
import { KeysOf, Projection, Modifiers } from './types';
import { hasModifier } from './validation';

export const project = <T extends object, P extends KeysOf<T>>(
  doc: T,
  projection: P
) => {
  if (!Array.isArray(projection)) throw new Error(NOT_ARRAY(projection));
  return projection.reduce((acc, key) => ({
    ...acc,
    [key]: doc[key]
  }), {} as Projection<T, P>);
};

export const modify = <T extends object>(doc: T, modifiers: Partial<Modifiers>): T => {
  Object.entries(modifiers).forEach(([modifier, value]) => {
    switch (modifier) {
      case '$push':
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach(entry => {
          const cur = dot.get(doc, entry[0]);
          if (!Array.isArray(cur)) throw new Error(NOT_ARRAY(cur));
          dot.set(doc, entry[0], [...cur, entry[1]]);
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
          if (typeof cur !== 'number') throw new Error(NOT_NUMBER(cur));
          dot.set(doc, entry[0], cur + entry[1]);
        });
        break;
      default:
        throw new Error(INVALID_MODIFIER(modifier));
    }
  });

  return doc;
};
