import type {
  Doc,
  Query,
  Draft,
  Update
} from './types';

import crypto from 'crypto';
import { merge } from 'rambda';

import { isDoc, isQueryMatch } from './validation';
import { DUPLICATE_DOC, INVALID_DOC, MEMORY_MODE } from './errors';
import Memory from './memory';
import Storage from './storage';

export type * from './types';

export type LeafDBOptions = {
  storage?: string | { root: string; name?: string };
};

export default class LeafDB<T extends Draft> {
  static id() {
    return [
      Date.now().toString(16),
      crypto.randomBytes(4).toString('hex')
    ].join('');
  }

  private readonly _memory: Memory<T>;
  private readonly _storage?: Storage;

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

    const root = typeof options?.storage === 'string' ?
      options.storage :
      options?.storage?.root;

    if (typeof root === 'string') {
      const name = typeof options?.storage !== 'string' ?
        options?.storage?.name ?? 'leaf-db' :
        'leaf-db';

      this._storage = new Storage({ root, name });
    }
  }

  open() {
    if (!this._storage) throw new Error(MEMORY_MODE('open'));

    const corrupted: Array<{ raw: string; err: unknown }> = [];
    const docs: Array<Doc<T>> = [];

    this._storage.open().forEach(raw => {
      try {
        if (raw.length > 0) {
          const doc = JSON.parse(raw);
          if (!isDoc<T>(doc)) throw new Error(INVALID_DOC(doc));
          docs.push(doc);
        }
      } catch (err) {
        corrupted.push({ raw, err });
      }
    });

    docs
      .filter(x => x.__deleted)
      .map(x => x._id)
      .forEach(doc => {
        const i = docs.findIndex(x => x._id === doc);

        if (i >= 0) docs.splice(i, 1);
      });

    this._storage.flush();
    docs
      .filter(doc => !doc.__deleted)
      .forEach(doc => this._set(doc));

    return corrupted;
  }

  close() {
    if (!this._storage) throw new Error(MEMORY_MODE('close'));
    this._storage.close();
  }

  insert(drafts: T[]) {
    const docs: Array<Doc<T>> = [];
    drafts.forEach(draft => {
      if (isDoc(draft)) {
        if (
          this._memory.has(draft._id) ||
          docs.some(doc => doc._id === draft._id)
        ) throw new Error(DUPLICATE_DOC(draft));
        docs.push(draft);
      } else {
        docs.push({ _id: LeafDB.id(), ...draft });
      }
    });

    return docs.map(doc => this._set(doc));
  }

  select(...queries: Array<Query<Doc<T>>>) {
    const docs: Array<Doc<T>> = [];
    for (const doc of this._memory.docs()) {
      if (
        !doc.__deleted &&
        queries.some(query => isQueryMatch(doc, query))
      ) docs.push(doc);
    }

    return docs;
  }

  selectById(...ids: string[]) {
    return ids.reduce<Array<Doc<T>>>((acc, cur) => {
      const doc = this._memory.get(cur);
      if (doc) acc.push(doc);
      return acc;
    }, []);
  }

  update(update: Update<Doc<T>>, ...queries: Array<Query<Doc<T>>>) {
    if ('_id' in update) throw new Error('Invalid update, cannot contain key `_id`');

    return this.select(...queries)
      .map(doc => {
        this._delete(doc._id);
        return this._set(merge(doc, update));
      });
  }

  delete(...queries: Array<Query<Doc<T>>>) {
    return this.select(...queries).reduce<number>((acc, cur) => {
      this._delete(cur._id);
      return acc + 1;
    }, 0);
  }

  drop() {
    this._memory.flush();
    this._storage?.flush();
  }
}
