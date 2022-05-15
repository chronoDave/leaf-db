import {
  Doc,
  KeysOf,
  OneOrMore,
  Query,
  Update,
  Projection
} from './types';
import {
  isDoc,
  isDocPrivate,
  isId,
  isModifier,
  isQuery,
  isQueryMatch,
  isUpdate
} from './validation';
import { toArray } from './utils';
import { modify, project } from './modifiers';
import {
  INVALID_DOC,
  INVALID_ID,
  INVALID_QUERY,
  INVALID_UPDATE,
  MEMORY_MODE
} from './errors';
import Memory from './memory';
import Storage from './storage';

export default class LeafDB<T extends Record<string, unknown>> {
  private readonly _storage?: Storage;
  private readonly _memory: Memory<T>;

  /**
   * @param options.name - Database name
   * @param options.root - Database folder, if emtpy, will run `leaf-db` in memory-mode
   * @param options.seed - Seed used for random `_id` generation, defaults to a random seed
   */
  constructor(options?: {
    name?: string,
    root?: string,
    seed?: number
  }) {
    this._memory = new Memory({ seed: options?.seed });

    if (options?.root) {
      this._storage = new Storage({
        root: options.root,
        name: options.name
      });
    }
  }

  private _set(doc: Doc<T>) {
    this._memory.set(doc);
    this._storage?.append(JSON.stringify(doc));
  }

  private _findDoc<P extends KeysOf<Doc<T>>>(_id: string, query: Query, projection?: P) {
    const doc = this._memory.get(_id);

    if (doc && isQueryMatch(doc, query)) {
      if (projection) return project(doc, projection);
      return doc;
    }

    return null;
  }

  private _updateDoc(doc: Doc<T>, update: Update<T>) {
    const newDoc = isModifier(update) ?
      modify(doc, update) :
      { ...update, _id: doc._id };

    return this._memory.set(newDoc);
  }

  /**
   * Load persistent data into memory.
   *
   * If `strict` is enabled, this will throw when it tries to load an invalid document.
   */
  async load(strict = false) {
    if (!this._storage) throw new Error(MEMORY_MODE('load'));

    const invalid: string[] = [];
    await this._storage.open(raw => {
      try {
        const doc = JSON.parse(raw);
        if (!isDocPrivate<T>(doc)) throw new Error(INVALID_DOC(doc));

        this._set(doc);
      } catch (err) {
        invalid.push(raw);
        if (strict) throw err;
      }
    });

    return invalid;
  }

  async close() {
    this._storage?.close();
  }

  /** Insert single new doc, returns created doc */
  insertOne(newDoc: T, options?: { strict?: boolean }) {
    if (!isDoc(newDoc) || (typeof newDoc._id === 'string' && this._memory.get(newDoc._id))) {
      if (options?.strict) return Promise.reject(INVALID_DOC(newDoc));
      return null;
    }

    return Promise.resolve(this._memory.set(newDoc));
  }

  /**
   * Insert a document or documents
   * @param {boolean} strict - If `true`, rejects on first failed insert
   * */
  async insert(x: OneOrMore<T>, options?: { strict?: boolean }) {
    return Promise
      .all(toArray(x).map(newDoc => this.insertOne(newDoc, options)))
      .then(docs => docs.reduce<Doc<T>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  async findOneById<P extends KeysOf<Doc<T>>>(_id: string, options?: { projection?: P }) {
    if (!isId(_id)) return Promise.reject(INVALID_ID(_id));

    const doc = this._memory.get(_id);
    if (doc) {
      if (options?.projection) return Promise.resolve(project(doc, options.projection));
      return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  async findById<P extends KeysOf<Doc<T>>>(x: OneOrMore<string>, options?: { projection?: P }) {
    return Promise
      .all(toArray(x).map(async _id => this.findOneById(_id, options)))
      .then(docs => docs.reduce<Projection<Doc<T>, P>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  async findOne<P extends KeysOf<Doc<T>>>(query: Query = {}, options?: { projection?: P }) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    for (let i = 0, ids = this._memory.all(); i < ids.length; i += 1) {
      const doc = this._findDoc(ids[i]._id, query, options?.projection);
      if (doc) return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  async find<P extends KeysOf<Doc<T>>>(query: Query = {}, options?: { projection?: P }) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    const docs = this._memory.all().reduce<Projection<Doc<T>, P>[]>((acc, { _id }) => {
      const doc = this._findDoc(_id, query, options?.projection);
      if (doc) acc.push(doc);
      return acc;
    }, []);

    return Promise.resolve(docs);
  }

  async updateOneById<P extends KeysOf<Doc<T>>>(
    _id: string,
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isId(_id)) return Promise.reject(INVALID_ID(_id));
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._updateDoc(doc as Doc<T>, update);
    if (options?.projection) return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  async updateById<P extends KeysOf<Doc<T>>>(
    x: OneOrMore<string>,
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));
    return Promise
      .all(toArray(x).map(async _id => this.updateOneById(_id, update, options)))
      .then(docs => docs.reduce<T[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  async updateOne<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._updateDoc(doc as Doc<T>, update);
    if (options?.projection) return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  async update<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const newDocs = this.find(query)
      .then(docs => docs.map(doc => {
        const newDoc = this._updateDoc(doc as Doc<T>, update);
        if (options?.projection) return project(newDoc, options.projection);
        return newDoc;
      }));

    return Promise.resolve(newDocs);
  }

  async deleteOneById(_id: string) {
    if (!isId(_id)) return Promise.reject(INVALID_ID(_id));

    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(0);

    this._memory.delete(doc._id as string);
    return Promise.resolve(1);
  }

  async deleteById(x: OneOrMore<string>) {
    return Promise.all(toArray(x).map(async _id => this.deleteOneById(_id)))
      .then(n => n.reduce<number>((acc, cur) => acc + cur, 0));
  }

  async deleteOne(query: Query = {}) {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(0);

    this._memory.delete(doc._id as string);
    return Promise.resolve(1);
  }

  async delete(query: Query = {}) {
    return this.find(query)
      .then(docs => docs.reduce<number>((acc, cur) => {
        this._memory.delete(cur._id as string);
        return acc + 1;
      }, 0));
  }

  drop() {
    this._memory.clear();
    this._storage?.clear();
  }
}
