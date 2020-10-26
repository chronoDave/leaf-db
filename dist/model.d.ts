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
    /** Insert new document(s) */
    insert(newDocs: NewDoc | Array<NewDoc>, { persist }?: {
        persist?: boolean | undefined;
    }): Promise<Doc[]>;
    /** Find doc(s) matching `_id` */
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
     * @param {string[]} projection - Projection array (default `null`)
    */
    updateById(_id: string | Array<string>, update?: NewDoc | Update, projection?: Projection): Promise<({} | null)[]>;
    /**
     * Update documents matching `query`
     * @param {string|object} query - Query object (default `{}`)
     * @param {object} update - New document (default `{}`) / Update query
     * @param {string[]} projection - Projection array (default `null`)
     */
    update(query?: Query, update?: NewDoc | Update, projection?: Projection): Promise<({} | null)[]>;
    /**
     * Delete doc matching `_id`
     * @param {string} _id
    */
    deleteById(_id: string | Array<string>): number | Promise<never>;
    /**
     * Delete documents matching `query`
     * @param {*} query - Query object (default `{}`)
     */
    delete(query?: Query): Promise<number>;
    /** Drop database */
    drop(): Promise<void>;
}
