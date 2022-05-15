import { DocPrivate } from './types';

export default class Memory<T extends object> {
  private readonly _map: Map<string, DocPrivate<T>> = new Map();

  set(doc: DocPrivate<T>) {
    this._map.set(doc._id, doc);
    return doc;
  }

  get(id: string) {
    const doc = this._map.get(id);
    if (!doc || doc.$deleted) return null;
    return doc;
  }

  clear() {
    this._map.clear();
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

  forEach(...args: Parameters<Map<string, DocPrivate<T>>['forEach']>) {
    this._map.forEach(...args);
  }

  keys() {
    return Array.from(this._map.values())
      .filter(doc => !doc.$deleted)
      .map(doc => doc._id);
  }
}
