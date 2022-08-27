import { INVALID_DOC, MEMORY_MODE } from './errors';
import Storage from './storage';
import { Doc } from './types';
import { idGenerator } from './utils';
import { isDoc } from './validation';

export type MemoryOptions = {
  seed?: number
  storage?: Storage
};

export default class Memory<T extends Record<string, unknown>> {
  private readonly _docs = new Map<string, Doc<T>>();
  private readonly _generateId: () => string;
  private readonly _storage?: Storage;

  constructor(options?: MemoryOptions) {
    this._generateId = idGenerator(options?.seed);
    this._storage = options?.storage;
  }

  async open(strict?: boolean) {
    if (!this._storage) throw new Error(MEMORY_MODE('open'));

    const invalid: string[] = [];
    await this._storage.open(raw => {
      try {
        const doc = JSON.parse(raw);
        if (!isDoc<T & { __deleted?: boolean }>(doc)) throw new Error(INVALID_DOC(doc));

        if (doc.__deleted) {
          this.delete(doc._id);
        } else {
          this.set(doc);
        }
      } catch (err) {
        if (strict) throw err;
        invalid.push(raw);
      }
    });

    return invalid;
  }

  async close() {
    return this._storage?.close();
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
    this._storage?.append(JSON.stringify(newDoc));

    return doc;
  }

  delete(_id: string) {
    this._storage?.append(JSON.stringify({ _id, __deleted: true }));
    return this._docs.delete(_id);
  }

  all() {
    return Array.from(this._docs.values());
  }

  clear() {
    this._docs.clear();
    this._storage?.clear();
  }
}
