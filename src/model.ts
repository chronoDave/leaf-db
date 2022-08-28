import crypto from 'crypto';

import {
  Doc,
  KeysOf,
  Query,
  Update,
  Projection,
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
import { modify, project } from './modifiers';
import {
  INVALID_DOC,
  INVALID_QUERY,
  INVALID_UPDATE,
  MEMORY_MODE
} from './errors';
import Memory from './memory';
import Storage from './storage';

export type LeafDBOptions = {
  storage?: string | [root: string, name?: string]
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

  private _get<P extends KeysOf<Doc<T>>>(_id: string, query: Query, projection?: P) {
    const doc = this._memory.get(_id);

    if (doc && isQueryMatch(doc, query)) {
      if (projection) return project(doc, projection);
      return doc;
    }

    return null;
  }

  private _set(doc: T | Doc<T>, update?: Update<T>) {
    let newDoc = doc;
    if (update) {
      newDoc = isModifier(update) ?
        modify(doc, update) :
        { ...update, _id: doc._id };
    }

    this._memory.set({
      ...newDoc,
      _id: newDoc._id ?? LeafDB.generateId()
    });
    this._storage?.append(JSON.stringify(doc));

    return newDoc;
  }

  private _delete(_id: string) {
    this._memory.delete(_id);
    this._storage?.append(JSON.stringify({ _id, __deleted: true }));
  }

  /**
   * @param options.name - Database name
   * @param options.root - Database folder, if emtpy, will run in memory-mode
   */
  constructor(options?: LeafDBOptions) {
    this._memory = new Memory();

    const root = Array.isArray(options?.storage) ?
      options?.storage[0] :
      options?.storage;

    if (root) {
      const name = (Array.isArray(options?.storage) && options?.storage[1]) ?
        options?.storage[1] :
        'leaf-db';

      this._storage = new Storage({ root, name });
    }
  }

  open(options?: { strict?: boolean }) {
    if (!this._storage) throw new Error(MEMORY_MODE('open'));
    const invalid: string[] = [];
    this._storage.open().forEach(raw => {
      try {
        if (raw.length > 0) {
          const doc = JSON.parse(raw);
          if (!isDoc<T & { __deleted?: boolean }>(doc)) throw new Error(INVALID_DOC(doc));

          if (doc.__deleted) {
            this._delete(doc._id);
          } else {
            this._set(doc);
          }
        }
      } catch (err) {
        if (options?.strict) throw err;
        invalid.push(raw);
      }
    });

    return invalid;
  }

  close() {
    if (!this._storage) throw new Error(MEMORY_MODE('close'));
    return this._storage?.close();
  }

  /** Insert single new doc, returns created doc */
  async insertOne(newDoc: T, options?: { strict?: boolean }) {
    if (!isDraft(newDoc) || (typeof newDoc._id === 'string' && this._memory.get(newDoc._id))) {
      if (options?.strict) return Promise.reject(INVALID_DOC(newDoc));
      return null;
    }

    return Promise.resolve(this._memory.set({
      ...newDoc,
      _id: typeof newDoc._id === 'string' ? newDoc._id : LeafDB.generateId()
    }));
  }

  /**
   * Insert a document or documents
   * @param {boolean} strict - If `true`, rejects on first failed insert
   * */
  async insert(newDocs: T[], options?: { strict?: boolean }) {
    return Promise
      .all(newDocs.map(async newDoc => this.insertOne(newDoc, options)))
      .then(docs => docs.reduce<Doc<T>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  async findOne<P extends KeysOf<Doc<T>>>(query: string | Query, options?: { projection?: P }) {
    if (typeof query === 'string') {
      const doc = this._memory.get(query);

      if (doc && options?.projection) return project(doc, options.projection);
      return Promise.resolve(doc);
    }

    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    for (let i = 0, ids = this._memory.all(); i < ids.length; i += 1) {
      const doc = this._get(ids[i]._id, query, options?.projection);
      if (doc) return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  async find<P extends KeysOf<Doc<T>>>(query: string[] | Query, options?: { projection?: P }) {
    if (Array.isArray(query)) {
      const docs = query
        .map(_id => this._memory.get(_id))
        .filter(x => x);

      return Promise.resolve(docs);
    }
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    const docs = this._memory.all().reduce<Projection<Doc<T>, P>[]>((acc, { _id }) => {
      const doc = this._get(_id, query, options?.projection);
      if (doc) acc.push(doc);
      return acc;
    }, []);

    return Promise.resolve(docs);
  }

  async updateOne<P extends KeysOf<Doc<T>>>(
    query: string | Query,
    update: Update<T>,
    options?: { projection?: P }
  ) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._set(doc as Doc<T>, update);
    if (options?.projection) return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  async update<P extends KeysOf<Doc<T>>>(
    query: string[] | Query,
    update: Update<T>,
    options?: { projection?: P }
  ) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const newDocs = this.find(query)
      .then(docs => docs.map(doc => {
        const newDoc = this._set(doc as Doc<T>, update);
        if (options?.projection) return project(newDoc, options.projection);
        return newDoc;
      }));

    return Promise.resolve(newDocs);
  }

  async deleteOne(query: string | Query): Promise<boolean> {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(false);

    this._delete(doc._id as string);
    return Promise.resolve(true);
  }

  async delete(query: string[] | Query): Promise<number> {
    const docs = await this.find(query);
    if (!Array.isArray(docs)) return Promise.resolve(0);

    // @ts-ignore
    return docs.reduce<number>((acc, cur) => {
      this._delete(cur._id as string);
      return acc + 1;
    }, 0);
  }

  drop() {
    this._memory.flush();
    this._storage?.flush();
  }
}
