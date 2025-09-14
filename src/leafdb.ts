import type { StorageOptions } from './lib/storage.ts';
import type { Doc, Draft } from './lib/parse.ts';
import type { Query } from './lib/query.ts';

import crypto from 'crypto';

import Storage from './lib/storage.ts';
import match from './lib/query.ts';
import parse from './lib/parse.ts';

export type { Json } from './lib/parse.ts';
export type {
  Draft,
  Doc,
  Query,
  StorageOptions
};

export type Corrupt = {
  raw: string;
  error: Error;
};

export default class LeafDB<T extends Draft> {
  static id() {
    return `${Date.now().toString(16)}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private readonly _memory: Map<string, Doc<T>>;
  private readonly _storage?: Storage;

  get docs(): Array<Doc<T>> {
    return Array.from(this._memory.values());
  }

  constructor(options?: StorageOptions) {
    this._memory = new Map();

    if (options) this._storage = new Storage(options);
  }

  async open(): Promise<Corrupt[]> {
    if (!this._storage) return [];

    let data = '';
    const corrupt: Corrupt[] = [];

    for (const raw of await this._storage.open()) {
      if (raw.length === 0) continue;

      try {
        const doc = parse(raw);

        if ('__deleted' in doc) {
          this._memory.delete(doc._id);
        } else {
          this._memory.set(doc._id, doc as Doc<T>);
          data += `\n${raw}`;
        }
      } catch (err) {
        corrupt.push({ raw, error: (err as Error) });
      }
    }

    await this._storage.write(data); // Overwrite file with clean data

    return corrupt;
  }

  async close() {
    return this._storage?.close();
  }

  get(id: string): Doc<T> | null {
    return this._memory.get(id) ?? null;
  }

  async set(draft: T & { _id?: string }): Promise<string> {
    if ('__deleted' in draft) throw new Error('Invalid draft, cannot contain key `__deleted`');
    if (typeof draft._id !== 'string') draft._id = LeafDB.id();

    this._memory.set(draft._id, draft as Doc<T>);
    await this._storage?.append(JSON.stringify(draft));

    return draft._id;
  }

  query(query: Query<T>): Array<Doc<T>> {
    const docs: Array<Doc<T>> = [];

    for (const doc of this._memory.values()) {
      if (match(doc)(query)) docs.push(doc);
    }

    return docs;
  }

  async delete(id: string) {
    this._memory.delete(id);

    await this._storage?.append(JSON.stringify({ _id: id, __deleted: true }));
  }

  async drop() {
    this._memory.clear();

    await this._storage?.flush();
  }
}
