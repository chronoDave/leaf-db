import produce from 'immer';
import crypto from 'crypto';

import { Doc, Draft } from './types';

export const generateId = () => [
  Date.now().toString(16),
  crypto.randomBytes(4).toString('hex')
].join('');

export const createDoc = <T extends Draft>(draft: T) =>
  produce(draft, _draft => {
    if (typeof _draft._id !== 'string') _draft._id = generateId();
  }) as Doc<T>;
