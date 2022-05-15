import crypto from 'crypto';

import { Doc } from './types';

export type MemoryOptions = {
  seed?: number
};

export default class Memory<T extends Record<string, unknown>> {
  private readonly _docs = new Map<string, Doc<T>>();
  private readonly _index = {
    _deleted: new Set<string>()
  };

  private _seed: number;

  constructor(options: MemoryOptions) {
    this._seed = options?.seed ?? crypto.randomBytes(1).readUInt8();
  }

  private _generateUid() {
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    this._seed += 1;
    return `${timestamp}${random}${this._seed.toString(16)}`;
  }

  get(id: string) {
    const doc = this._docs.get(id);
    if (!doc || this._index._deleted.has(doc._id)) return null;
    return doc;
  }

  set(newDoc: T) {
    const _id = typeof newDoc._id === 'string' ?
      newDoc._id :
      this._generateUid();

    const doc = { ...newDoc, _id };

    this._docs.set(_id, doc);
    return doc;
  }

  delete(id: string) {
    if (this._index._deleted.has(id)) return;
    if (!this.get(id)) return;

    this._index._deleted.add(id);
  }

  all() {
    return Array.from(this._docs.values());
  }

  clear() {
    this._index._deleted.clear();
    this._docs.clear();
  }
}