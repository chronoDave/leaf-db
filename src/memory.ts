import { Doc, Draft } from './types';

export default class Memory<T extends Draft> {
  private readonly _docs: Map<string, Doc<T>>;

  constructor() {
    this._docs = new Map();
  }

  get(_id: string) {
    return this._docs.get(_id) || null;
  }

  set(doc: Doc<T>) {
    this._docs.set(doc._id, doc);

    return doc;
  }

  has(_id: string) {
    if (!this._docs.has(_id)) return false;

    const doc = this._docs.get(_id);
    return !doc?.__deleted;
  }

  delete(_id: string) {
    return this._docs.delete(_id);
  }

  all() {
    return Array.from(this._docs.values());
  }

  flush() {
    this._docs.clear();
  }
}
