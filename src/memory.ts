import { Doc } from './types';
import { idGenerator } from './utils';

export type MemoryOptions = {
  seed?: number
};

export default class Memory<T extends Record<string, unknown>> {
  private readonly _docs = new Map<string, Doc<T>>();
  private readonly _generateId: () => string;

  constructor(options?: MemoryOptions) {
    this._generateId = idGenerator(options?.seed);
  }

  get(_id: string) {
    return this._docs.get(_id) || null;
  }

  set(newDoc: T | Doc<T>) {
    const _id = typeof newDoc._id === 'string' ?
      newDoc._id :
      this._generateId();

    const doc = { ...newDoc, _id };

    this._docs.set(_id, doc);
    return doc;
  }

  delete(id: string) {
    return this._docs.delete(id);
  }

  all() {
    return Array.from(this._docs.values());
  }

  clear() {
    this._docs.clear();
  }
}
