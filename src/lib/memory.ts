import type { Doc, Draft } from './is.ts';

export default class Memory<T extends Draft> {
  private readonly _docs: Map<string, Doc<T>>;

  constructor() {
    this._docs = new Map();
  }

  get(_id: string) {
    return this._docs.get(_id) ?? null;
  }

  set(doc: Doc<T>) {
    this._docs.set(doc._id, doc);

    return doc;
  }

  has(_id?: string) {
    if (typeof _id !== 'string' || !this._docs.has(_id)) return false;
    return !this._docs.get(_id)?.__deleted;
  }

  delete(_id: string) {
    return this._docs.delete(_id);
  }

  docs() {
    return this._docs.values();
  }

  flush() {
    this._docs.clear();
  }
}
