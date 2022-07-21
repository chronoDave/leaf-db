import {
  Doc,
  KeysOf,
  OneOrMore,
  Query,
  Update,
  Projection
} from './types';
import {
  isDraft,
  isModifier,
  isQuery,
  isQueryMatch,
  isUpdate
} from './validation';
import { toArray } from './utils';
import { modify, project } from './modifiers';
import { INVALID_DOC, INVALID_QUERY, INVALID_UPDATE } from './errors';
import Memory from './memory';

export default class LeafDB<T extends Record<string, unknown>> {
  private readonly _memory: Memory<T>;

  private _get<P extends KeysOf<Doc<T>>>(_id: string, query: Query, projection?: P) {
    const doc = this._memory.get(_id);

    if (doc && isQueryMatch(doc, query)) {
      if (projection) return project(doc, projection);
      return doc;
    }

    return null;
  }

  private _set(doc: T, update?: Update<T>) {
    let newDoc = doc;
    if (update) {
      newDoc = isModifier(update) ?
        modify(doc, update) :
        { ...update, _id: doc._id };
    }

    this._memory.set(newDoc);

    return newDoc;
  }

  private _delete(_id: string) {
    this._memory.delete(_id);
  }

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
    this._memory = new Memory({
      seed: options?.seed,
      storage: options?.root ? {
        name: options?.name ?? 'leaf-db',
        root: options.root
      } : undefined
    });
  }

  async open(options?: { strict?: boolean }) {
    return this._memory.open(options?.strict);
  }

  async close() {
    return this._memory.close();
  }

  /** Insert single new doc, returns created doc */
  insertOne(newDoc: T, options?: { strict?: boolean }) {
    if (!isDraft(newDoc) || (typeof newDoc._id === 'string' && this._memory.get(newDoc._id))) {
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
      const doc = this._get(ids[i]._id, query, options?.projection);
      if (doc) return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  async find<P extends KeysOf<Doc<T>>>(query: Query = {}, options?: { projection?: P }) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    const docs = this._memory.all().reduce<Projection<Doc<T>, P>[]>((acc, { _id }) => {
      const doc = this._get(_id, query, options?.projection);
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
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._set(doc as Doc<T>, update);
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

    const newDoc = this._set(doc as Doc<T>, update);
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
        const newDoc = this._set(doc as Doc<T>, update);
        if (options?.projection) return project(newDoc, options.projection);
        return newDoc;
      }));

    return Promise.resolve(newDocs);
  }

  async deleteOneById(_id: string) {
    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(0);

    this._delete(doc._id as string);
    return Promise.resolve(1);
  }

  async deleteById(x: OneOrMore<string>) {
    return Promise.all(toArray(x).map(async _id => this.deleteOneById(_id)))
      .then(n => n.reduce<number>((acc, cur) => acc + cur, 0));
  }

  async deleteOne(query: Query = {}) {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(0);

    this._delete(doc._id as string);
    return Promise.resolve(1);
  }

  async delete(query: Query = {}) {
    return this.find(query)
      .then(docs => docs.reduce<number>((acc, cur) => {
        this._delete(cur._id as string);
        return acc + 1;
      }, 0));
  }

  drop() {
    this._memory.clear();
  }
}
