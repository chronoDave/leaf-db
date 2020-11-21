/// <reference types="node" />
import { PathLike } from 'fs';
import { Doc, NewDoc, Query, Projection, Update } from './types';
export default class LeafDB {
    root?: string;
    strict: boolean;
    file?: PathLike;
    data: Record<string, Doc>;
    constructor(name: string, options?: {
        root?: string;
        autoload?: boolean;
        strict?: boolean;
    });
    /**
     * Initialize database
     * @returns {string[]} List of corrupt items
     * */
    load(): string[];
    /**
     * Persist database
     * @param {object} data - Hash table (default `this.data`)
     * */
    persist(data?: Record<string, Doc>): void;
    /**
     * Insert new document(s)
     * @param {object|object[]} newDocs
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     * */
    insert(newDocs: NewDoc | Array<NewDoc>, { persist }?: {
        persist?: boolean | undefined;
    }): Promise<Doc[]>;
    /**
     * Find doc(s) matching `_id`
     * @param {string|string[]} _id - Doc _id
     * @param {string[]} projection - Projection array (default `null`)
     * */
    findById(_id: string | Array<string>, projection?: Projection): Promise<Doc[]>;
    /**
     * Find all documents matching `query`
     * @param {string|object} query - Query object (default `{}`)
     * @param {string[]} projection - Projection array (default `null`)
     */
    find(query?: Query, projection?: Projection): Promise<({} | null)[]>;
    /**
     * Update single doc matching `_id`
     * @param {string} _id
     * @param {object} update - New document (default `{}`) / Update query
     * @param {object} options
     * @param {string[]} options.projection - Projection array (default `null`)
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
    */
    updateById(_id: string | Array<string>, update?: NewDoc | Update, options?: {
        projection: Projection;
        persist: boolean;
    }): Promise<({} | null)[]>;
    /**
     * Update documents matching `query`
     * @param {string|object} query - Query object (default `{}`)
     * @param {object} update - New document (default `{}`) / Update query
     * @param {object} options
     * @param {string[]} options.projection - Projection array (default `null`)
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     */
    update(query?: Query, update?: NewDoc | Update, options?: {
        projection: Projection;
        persist: boolean;
    }): Promise<({} | null)[]>;
    /**
     * Delete doc matching `_id`
     * @param {string} _id
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
    */
    deleteById(_id: string | Array<string>, { persist }?: {
        persist?: boolean | undefined;
    }): Promise<number>;
    /**
     * Delete documents matching `query`
     * @param {*} query - Query object (default `{}`)
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     */
    delete(query?: Query, { persist }?: {
        persist?: boolean | undefined;
    }): Promise<number>;
    /** Drop database */
    drop(): Promise<void>;
}
