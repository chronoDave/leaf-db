import crypto from 'crypto';

import { Doc } from './types';

export type MemoryOptions = {
  seed?: number
};

export default class Memory<T extends Record<string, unknown>> {
  private readonly _map: Map<string, Doc<T>> = new Map();
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
    const doc = this._map.get(id);
    if (!doc || doc.$deleted) return null;
    return doc;
  }

  set(doc: T) {
    const _id = typeof doc._id === 'string' ?
      doc._id :
      this._generateUid();

    this._map.set(_id, { ...doc, _id });
    return this._map.get(_id) as Doc<T>;
  }

  delete(id: string) {
    const doc = this.get(id);
    if (doc) {
      this._map.set(id, {
        ...doc,
        $deleted: true
      });
    }
  }

  all() {
    return Array.from(this._map.values())
      .filter(doc => !doc.$deleted);
  }

  clear() {
    this._map.clear();
  }
}
