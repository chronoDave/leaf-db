import crypto from 'crypto';
import pMap from 'p-map';

import {
  Doc,
  Query,
  Update,
  Draft
} from './types';
import {
  isDoc,
  isDraft,
  isModifier,
  isQuery,
  isQueryMatch,
  isUpdate
} from './validation';
import { modify } from './modifiers';
import {
  INVALID_DOC,
  INVALID_QUERY,
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

  private _query(_id: string, query: Query) {
    const doc = this._memory.get(_id);
    if (!doc || doc.__deleted) return null;
    return isQueryMatch(doc, query) ?
      doc :
      null;
  }

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

  async insertOne(newDoc: T) {
    if (!isDraft(newDoc) || (typeof newDoc._id === 'string' && this._memory.has(newDoc._id))) {
      if (this._strict) return Promise.reject(INVALID_DOC(newDoc));
      return null;
    }

    return Promise.resolve(this._set({
      ...newDoc,
      _id: typeof newDoc._id === 'string' ? newDoc._id : LeafDB.generateId()
    }));
  }

  async insert(newDocs: T[]) {
    return pMap(newDocs, async newDoc => this.insertOne(newDoc), { concurrency: 64 })
      .then(docs => docs.reduce<Array<Doc<T>>>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  async findOne(query: string | Query) {
    if (typeof query === 'string') {
      const doc = this._memory.get(query);
      return Promise.resolve(doc);
    }

    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    for (let i = 0, ids = this._memory.all(); i < ids.length; i += 1) {
      const doc = this._query(ids[i]._id, query);
      if (doc) return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  async find(query: string[] | Query) {
    if (Array.isArray(query)) {
      const docs = query
        .reduce<Array<Doc<T>>>((acc, cur) => {
          const doc = this._memory.get(cur);
          if (doc) acc.push(doc);
          return acc;
        }, []);

      return Promise.resolve(docs);
    }
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    const docs = this._memory.all().reduce<Array<Doc<T>>>((acc, { _id }) => {
      const doc = this._query(_id, query);
      if (doc) acc.push(doc);
      return acc;
    }, []);

    return Promise.resolve(docs);
  }

  async updateOne(query: string | Query, update: Update<T>) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(null);

    const newDoc = isModifier(update) ?
      modify(doc, update) :
      { ...update, _id: doc._id };
    return Promise.resolve(this._set(newDoc));
  }

  async update(query: string[] | Query, update: Update<T>) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const newDocs = this.find(query)
      .then(docs => docs.map(doc => isModifier(update) ?
        modify(doc, update) :
        { ...update, _id: doc._id }));

    return Promise.resolve(newDocs);
  }

  async deleteOne(query: string | Query): Promise<boolean> {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(false);

    this._delete(doc._id);
    return Promise.resolve(true);
  }

  async delete(query: string[] | Query): Promise<number> {
    const docs = await this.find(query);
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
