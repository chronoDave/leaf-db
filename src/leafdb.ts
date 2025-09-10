import type { StorageOptions } from './lib/storage.ts';
import type {
  Doc,
  Query,
  Draft
} from './lib/is.ts';

import crypto from 'crypto';
import { merge } from 'rambda';

import * as is from './lib/is.ts';
import Storage from './lib/storage.ts';

export type * from './lib/types.ts';
export type * from './lib/is.ts';

export type Corrupt = {
  raw: string;
  err: Error;
};

export type Update<T> = Omit<Partial<{
  [K in keyof T]?: T[K] extends object ?
    Update<T[K]> :
    T[K]
}>, '_id' | '__deted'>;

export default class LeafDB<T extends Draft> {
  static id() {
    return [
      Date.now().toString(16),
      crypto.randomBytes(4).toString('hex')
    ].join('');
  }

  private readonly _memory: Map<string, Doc<T>>;
  private readonly _storage?: Storage;

  private async _set(doc: Doc<T>) {
    this._memory.set(doc._id, doc);

    await this._storage?.append(JSON.stringify(doc));
  }

  constructor(options?: StorageOptions) {
    this._memory = new Map();

    if (options) this._storage = new Storage(options);
  }

  async open(): Promise<Corrupt[]> {
    if (!this._storage) return [];

    const entries = await this._storage.open();
    const corrupt = entries.reduce<Corrupt[]>((acc, cur) => {
      if (cur.length === 0) return acc;
      
      try {
        const doc = JSON.parse(cur);
        if (!is.doc<T>(doc)) throw new Error('Invalid document');
        if (doc.__deleted) {
          this._memory.delete(doc._id);
        } else {
          this._memory.set(doc._id, doc);
        }
      } catch (err) {
        acc.push({ raw: cur, err: err as Error });
      }

      return acc;
    }, []);

    // Overwrite file with clean data
    const clean = Array.from(this._memory.values())
      .reduce<string>((acc, cur) => `${acc}\n${JSON.stringify(cur)}`, '');
    await this._storage.write(clean);

    return corrupt;
  }

  async close() {
    return this._storage?.close();
  }

  async insert(drafts: Array<Draft & T>): Promise<Array<Doc<T>>> {
    const results: Array<Doc<T>> = [];

    for (const draft of drafts) {
      if (typeof draft._id !== 'string') {
        draft._id = LeafDB.id();

        await this._set(draft as Doc<T>);
        results.push(draft as Doc<T>);
      } else if (!this._memory.has(draft._id)) {
        await this._set(draft as Doc<T>);

        results.push(draft as Doc<T>);
      }
    }

    return results;
  }

  select(...ids: string[]): Array<Doc<T>> {
    if (ids.length === 0) return Array.from(this._memory.values());
    return ids.reduce<Array<Doc<T>>>((acc, cur) => {
      const doc = this._memory.get(cur);
      if (doc) acc.push(doc);
      return acc;
    }, []);
  }

  query(...queries: Array<Query<Doc<T>>>): Array<Doc<T>> {
    const docs = Array.from(this._memory.values());

    if (queries.length === 0) return docs;
    return docs.reduce<Array<Doc<T>>>((acc, cur) => {
      if (cur.__deleted) return acc;
      if (queries.some(query => is.queryMatch(cur, query))) acc.push(cur);

      return acc;
    }, []);
  }

  async update(update: Update<Doc<T>>, ...queries: Array<Query<Doc<T>>>): Promise<Array<Doc<T>>> {
    if ('_id' in update) throw new Error('Invalid update, cannot contain key `_id`');
    if ('__deleted' in update) throw new Error('Invalid update, cannot contain key `__deleted`');

    const docs: Array<Doc<T>> = [];
    for (const doc of this.query(...queries)) {
      const next = merge<Doc<T>>(doc)(update);

      await this._set(next);
      docs.push(next);
    }

    return docs;
  }

  async delete(...ids: string[]): Promise<number> {
    const docs = this.select(...ids);

    for (const doc of docs) {
      this._memory.delete(doc._id);

      await this._storage?.append(JSON.stringify({ _id: doc._id, __deleted: true }));
    }

    return docs.length;
  }

  async drop() {
    this._memory.clear();

    await this._storage?.flush();
  }
}
