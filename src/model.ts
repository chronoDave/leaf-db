import crypto from 'crypto';

import {
  Doc,
  Query,
  Update,
  Draft
} from './types';
import {
  isDoc,
  isModifier,
  isQueryMatch,
  isUpdate
} from './validation';
import { modify } from './modifiers';
import {
  DUPLICATE_DOC,
  DUPLICATE_DOCS,
  INVALID_DOC,
  INVALID_UPDATE,
  MEMORY_MODE
} from './errors';
import Memory from './memory';
import Storage from './storage';

export * from './types';

export type LeafDBOptions = {
  storage?: string | { root: string, name?: string }
  strict?: boolean
};

export default class LeafDB<T extends Draft> {
  static generateId() {
    return [
      Date.now().toString(16),
      crypto.randomBytes(4).toString('hex')
    ].join('');
  }

  private readonly _memory: Memory<T>;
  private readonly _storage?: Storage;
  private readonly _strict: boolean;

  private _set(doc: Doc<T>) {
    this._memory.set(doc);
    this._storage?.append(JSON.stringify(doc));

    return doc;
  }

  private _delete(_id: string) {
    this._memory.delete(_id);
    this._storage?.append(JSON.stringify({ _id, __deleted: true }));
  }

  constructor(options?: LeafDBOptions) {
    this._memory = new Memory();
    this._strict = options?.strict ?? false;

    const root = typeof options?.storage === 'string' ?
      options?.storage :
      options?.storage?.root;

    if (root) {
      const name = (typeof options?.storage !== 'string') ?
        (options?.storage?.name ?? 'leaf-db') :
        'leaf-db';

      this._storage = new Storage({ root, name });
    }
  }

  open() {
    if (!this._storage) throw new Error(MEMORY_MODE('open'));

    const corrupted: string[] = [];
    const docs: Array<Doc<T>> = [];

    this._storage.open().forEach(raw => {
      try {
        if (raw.length > 0) {
          const doc = JSON.parse(raw);
          if (!isDoc<T>(doc)) throw new Error(INVALID_DOC(doc));
          if (!doc.__deleted) docs.push(doc);
        }
      } catch (err) {
        if (this._strict) throw err;
        corrupted.push(raw);
      }
    });

    this._storage.flush();
    docs.forEach(doc => this._set(doc));

    return corrupted;
  }

  close() {
    if (!this._storage) throw new Error(MEMORY_MODE('close'));
    return this._storage?.close();
  }

  insert(drafts: T[]) {
    if (this._strict) {
      if (drafts.length !== new Set(drafts).size) throw new Error(DUPLICATE_DOCS);
      const doc = drafts.find(draft => this._memory.has(draft._id));
      if (doc) throw new Error(DUPLICATE_DOC(doc as Doc<T>));
    }

    return drafts.reduce<Array<Doc<T>>>((acc, cur) => {
      const _id = cur._id ?? LeafDB.generateId();
      if (!this._memory.has(_id)) acc.push(this._set({ ...cur, _id }));

      return acc;
    }, []);
  }

  async find(...queries: Array<Query<Doc<T>>>) {
    const docs: Array<Doc<T>> = [];
    for (const doc of this._memory.docs()) {
      if (
        !doc.__deleted &&
        queries.some(query => isQueryMatch(doc, query))
      ) docs.push(doc);
    }

    return Promise.resolve(docs);
  }

  async update(update: Update<T>, ...queries: Array<Query<Doc<T>>>) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const newDocs = this.find(...queries)
      .then(docs => docs.map(doc => isModifier(update) ?
        modify(doc, update) :
        { ...update, _id: doc._id }));

    return Promise.resolve(newDocs);
  }

  async delete(...queries: Array<Query<Doc<T>>>): Promise<number> {
    const docs = await this.find(...queries);
    if (!Array.isArray(docs)) return Promise.resolve(0);

    return docs.reduce<number>((acc, cur) => {
      this._delete(cur._id);
      return acc + 1;
    }, 0);
  }

  drop() {
    this._memory.flush();
    this._storage?.flush();
  }
}
