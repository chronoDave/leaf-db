import { INVALID_DOC, MEMORY_MODE } from './errors';
import Storage from './storage';
import { Doc } from './types';
import { isDoc } from './validation';

export type MemoryOptions = {
  storage?: Storage
};

export default class Memory<T extends Record<string, unknown>> {
  private readonly _docs: Map<string, Doc<T>>;
  private readonly _storage?: Storage;

  constructor(options?: MemoryOptions) {
    this._docs = new Map();
    this._storage = options?.storage;
  }

  open(strict?: boolean) {
    if (!this._storage) throw new Error(MEMORY_MODE('open'));

    const invalid: string[] = [];
    this._storage.open().forEach(raw => {
      try {
        if (raw.length > 0) {
          const doc = JSON.parse(raw);
          if (!isDoc<T & { __deleted?: boolean }>(doc)) throw new Error(INVALID_DOC(doc));

          if (doc.__deleted) {
            this.delete(doc._id);
          } else {
            this.set(doc);
          }
        }
      } catch (err) {
        if (strict) throw err;
        invalid.push(raw);
      }
    });

    return invalid;
  }

  close() {
    return this._storage?.close();
  }

  get(_id: string) {
    return this._docs.get(_id) || null;
  }

  set(doc: Doc<T>) {
    this._docs.set(doc._id, doc);
    this._storage?.append(JSON.stringify(doc));

    return doc;
  }

  delete(_id: string) {
    this._storage?.append(JSON.stringify({ _id, __deleted: true }));
    return this._docs.delete(_id);
  }

  all() {
    return Array.from(this._docs.values());
  }

  flush() {
    this._docs.clear();
    this._storage?.flush();
  }
}
