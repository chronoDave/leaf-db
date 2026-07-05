import type { StorageOptions } from './lib/storage.ts';
import type { Doc, Draft } from './lib/parse.ts';
import type { Query } from './lib/query.ts';
import type Storage from './lib/storage.ts';

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
  readonly #memory: Map<string, Doc<T>>;

  #storage?: Storage;

  async #set(doc: Doc<T>) {
    this.#memory.set(doc._id, doc);
    await this.#storage?.append(JSON.stringify(doc));
  }

  constructor() {
    this.#memory = new Map();
  }

  /** Get all documents */
  get docs(): Array<Doc<T>> {
    return Array.from(this.#memory.values());
  }

  /** Read existing file and store to internal memory */
  async open(storage: Storage): Promise<Corrupt[]> {
    this.#storage = storage;

    let data = '';
    const corrupt: Corrupt[] = [];

    for (const raw of await this.#storage.open()) {
      if (raw.length === 0) continue;

      try {
        const doc = parse(raw);

        if ('__deleted' in doc) {
          this.#memory.delete(doc._id);
        } else {
          this.#memory.set(doc._id, doc as Doc<T>);
          data += `${raw}\n`;
        }
      } catch (err) {
        corrupt.push({ raw, error: (err as Error) });
      }
    }

    await this.#storage.write(data); // Overwrite file with clean data

    return corrupt;
  }

  /** Close file */
  async close() {
    return this.#storage?.close();
  }

  /** Get document by `id` */
  get(id: string): Doc<T> | null {
    return this.#memory.get(id) ?? null;
  }

  /** Create new document, throws if document already exists */
  async insert(draft: T & { _id?: string }): Promise<Doc<T>> {
    if (typeof draft._id !== 'string') {
      draft._id = crypto.randomUUID();
    } else if (this.#memory.has(draft._id)) {
      throw new Error('Invalid draft, _id already exists');
    }

    await this.#set(draft as Doc<T>);

    return draft as Doc<T>;
  }

  /** Find document by query */
  query(query: Query<T>): Array<Doc<T>> {
    const docs: Array<Doc<T>> = [];

    for (const doc of this.#memory.values()) {
      if (match(doc)(query)) docs.push(doc);
    }

    return docs;
  }

  /** Update document, throws if document does not exist */
  async update(doc: Doc<T>) {
    if (!this.#memory.has(doc._id)) throw new Error('Tried to update new document');
    return this.#set(doc);
  }

  /** Delete document by `id` */
  async delete(id: string) {
    if (!this.#memory.has(id)) return;

    this.#memory.delete(id);

    await this.#storage?.append(JSON.stringify({ _id: id, __deleted: true }));
  }

  /** Delete all documents */
  async drop() {
    this.#memory.clear();

    await this.#storage?.flush();
  }
}
