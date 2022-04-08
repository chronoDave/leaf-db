import fs, { PathLike } from 'fs';
import path from 'path';
import crypto from 'crypto';

import {
  Doc,
  DocPrivate,
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

export default class LeafDB<T extends object> {
  readonly root?: string;
  readonly file?: PathLike;

  private seed: number;
  private map: Record<string, DocPrivate<T>> = {};
  private list: Set<string> = new Set();

  /**
   * @param options.name - Database name
   * @param options.root - Database folder, if emtpy, will run `leaf-db` in memory-mode
   * @param options.seed - Seed used for random `_id` generation, defaults to a random seed
   * @param options.disableAutoload - If true, disabled loading file data into memory
   */
  constructor(options?: {
    name?: string,
    root?: string,
    disableAutoload?: boolean,
    seed?: number
  }) {
    this.seed = options?.seed || crypto.randomBytes(1).readUInt8();

    if (options?.root) {
      fs.mkdirSync(options.root, { recursive: true });
      this.file = path.resolve(options.root, `${options?.name || 'leaf-db'}.txt`);
      if (!options?.disableAutoload) this.load();
    }
  }

  private flush() {
    this.map = {};
    this.list = new Set();
  }

  private get(_id: string): DocPrivate<T> | null {
    const doc = this.map[_id];

    return (doc && !doc.$deleted) ? doc : null;
  }

  private add(doc: DocPrivate<T>) {
    this.list.add(doc._id);
    this.map[doc._id] = doc;

    return doc;
  }

  private remove(_id: string) {
    this.list.delete(_id);
    delete this.map[_id];
  }

  private findDoc<P extends KeysOf<Doc<T>>>(_id: string, query: Query, projection?: P) {
    const doc = this.get(_id);

    if (doc && isQueryMatch(doc, query)) {
      if (projection) return project(doc, projection);
      return doc;
    }

    return null;
  }

  private updateDoc(doc: DocPrivate<T>, update: Update<T>) {
    const newDoc = isModifier(update) ?
      modify(doc, update) :
      { ...update, _id: doc._id };

    this.map[doc._id] = newDoc;

    return newDoc;
  }

  private deleteDoc(doc: DocPrivate<T>) {
    this.map[doc._id] = { ...doc, $deleted: true };
  }

  generateUid() {
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    this.seed += 1;
    return `${timestamp}${random}${this.seed.toString(16)}`;
  }

  /**
   * Load persistent data into memory.
   *
   * If `strict` is enabled, this will throw when it tries to load an invalid document.
   * @returns {string[]} List of corrupted documents
   */
  load(strict = false) {
    if (!this.file) throw new Error(MEMORY_MODE('load'));
    if (!fs.existsSync(this.file)) return [];

    this.flush();

    return fs.readFileSync(this.file, 'utf-8')
      .split('\n')
      .filter(raw => {
        try {
          const doc = JSON.parse(raw);
          if (!isDocPrivate<T>(doc)) throw new Error(INVALID_DOC(doc));

          this.add(doc);

          return false;
        } catch (err) {
          if (strict) throw err;

          return raw.length !== 0;
        }
      });
  }

  /**
   * Persist database memory.
   *
   * Any documents marked for deletion will be cleaned up here.
   * If `strict` is enabled, this will throw when persisting fails
   * */
  persist(strict = false) {
    if (!this.file) throw new Error(MEMORY_MODE('persist'));

    const data: string[] = [];
    this.list.forEach(_id => {
      try {
        const doc = this.get(_id);
        if (!doc) throw new Error(INVALID_DOC(doc));
        data.push(JSON.stringify(doc));
      } catch (err) {
        if (strict) throw err;

        this.remove(_id);
      }
    });

    fs.writeFileSync(this.file, data.join('\n'));
  }

  /** Insert single new doc, returns created doc */
  insertOne(newDoc: Doc<T>, options?: { strict?: boolean }) {
    if (!isDoc(newDoc) || this.get(newDoc._id as string)) {
      if (options?.strict) return Promise.reject(INVALID_DOC(newDoc));
      return null;
    }

    return Promise.resolve(this.add({
      ...newDoc,
      _id: newDoc._id || this.generateUid()
    }));
  }

  /**
   * Insert a document or documents
   * @param {boolean} strict - If `true`, rejects on first failed insert
   * */
  insert(x: OneOrMore<Doc<T>>, options?: { strict?: boolean }) {
    return Promise
      .all(toArray(x).map(newDoc => this.insertOne(newDoc, options)))
      .then(docs => docs.reduce<Doc<T>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  findOneById<P extends KeysOf<Doc<T>>>(_id: string, options?: { projection?: P }) {
    if (!isId(_id)) return Promise.reject(INVALID_ID(_id));

    const doc = this.get(_id);
    if (doc) {
      if (options?.projection) return Promise.resolve(project(doc, options.projection));
      return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  findById<P extends KeysOf<Doc<T>>>(x: OneOrMore<string>, options?: { projection?: P }) {
    return Promise
      .all(toArray(x).map(_id => this.findOneById(_id, options)))
      .then(docs => docs.reduce<Projection<DocPrivate<T>, P>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, []));
  }

  findOne<P extends KeysOf<Doc<T>>>(query: Query = {}, options?: { projection?: P }) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    for (let i = 0, ids = Array.from(this.list); i < ids.length; i += 1) {
      const doc = this.findDoc(ids[i], query, options?.projection);
      if (doc) return Promise.resolve(doc);
    }

    return Promise.resolve(null);
  }

  find<P extends KeysOf<Doc<T>>>(query: Query = {}, options?: { projection?: P }) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));

    const docs = Array.from(this.list).reduce<Projection<DocPrivate<T>, P>[]>((acc, _id) => {
      const doc = this.findDoc(_id, query, options?.projection);
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

    const newDoc = this.updateDoc(doc, update);
    if (options?.projection) return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  updateById<P extends KeysOf<Doc<T>>>(
    x: OneOrMore<string>,
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));
    return Promise
      .all(toArray(x).map(_id => this.updateOneById(_id, update, options)))
      .then(docs => docs.reduce<Doc<T>[]>((acc, doc) => {
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

    const newDoc = this.updateDoc(doc, update);
    if (options?.projection) return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  update<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) return Promise.reject(INVALID_QUERY(query));
    if (!isUpdate(update)) return Promise.reject(INVALID_UPDATE(update));

    const newDocs = this.find(query)
      .then(docs => docs.map(doc => {
        const newDoc = this.updateDoc(doc, update);
        if (options?.projection) return project(newDoc, options.projection);
        return newDoc;
      }));

    return Promise.resolve(newDocs);
  }

  async deleteOneById(_id: string) {
    if (!isId(_id)) return Promise.reject(INVALID_ID(_id));

    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(0);

    this.deleteDoc(doc);
    return Promise.resolve(1);
  }

  deleteById(x: OneOrMore<string>) {
    return Promise.all(toArray(x).map(_id => this.deleteOneById(_id)))
      .then(n => n.reduce<number>((acc, cur) => acc + cur, 0));
  }

  async deleteOne(query: Query = {}) {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(0);

    this.deleteDoc(doc);
    return Promise.resolve(1);
  }

  async delete(query: Query = {}) {
    return this.find(query)
      .then(docs => docs.reduce<number>((acc, cur) => {
        this.deleteDoc(cur);
        return acc + 1;
      }, 0));
  }

  drop() {
    this.flush();
    if (this.file) this.persist();
  }
}
