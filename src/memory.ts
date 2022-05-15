import { DocPrivate } from './types';

export default class Memory<T extends object> {
  private readonly _map: Map<string, DocPrivate<T>> = new Map();

  get(id: string) {
    const doc = this._map.get(id);
    if (!doc || doc.$deleted) return null;
    return doc;
  }

  set(doc: DocPrivate<T>) {
    this._map.set(doc._id, doc);
    return doc;
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
