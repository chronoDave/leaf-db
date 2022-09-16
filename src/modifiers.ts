import * as dot from '@chronocide/dot-obj';

import { INVALID_MODIFIER } from './errors';
import { Modifiers } from './types';
import { hasModifier } from './validation';

export const modify = <T extends Record<string, unknown>>(
  doc: T,
  modifiers: Partial<Modifiers>
): T => {
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
