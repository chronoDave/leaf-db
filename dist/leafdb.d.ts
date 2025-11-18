type StorageOptions = {
    name: string;
    dir: string;
};

type Json = string | number | boolean | null | Json[] | {
    [key: string]: Json;
};
type Draft = Record<string, Json> & {
    [key: `$${string}`]: never;
    [key: `__${string}`]: never;
};
type Doc<T extends Draft> = T & {
    readonly _id: string;
};

type Operator<T extends Record<string, Json>> = {
    [K in keyof T]?: T[K] extends number ? Partial<T[K]> | {
        $gt: number;
    } | {
        $gte: number;
    } | {
        $lt: number;
    } | {
        $lte: number;
    } : T[K] extends string ? Partial<T[K]> | {
        $regexp: RegExp;
    } : T[K] extends unknown[] ? Partial<T[K]> | {
        $length: number;
    } | {
        $includes: unknown;
    } : T[K] extends Record<string, Json> ? Partial<T[K]> | Operator<T[K]> : Partial<T[K]>;
};
type Query<T extends Draft> = {
    $not?: Query<T>;
    $or?: Array<Query<T>>;
    $and?: Array<Query<T>>;
} | Operator<T>;

type Corrupt = {
    raw: string;
    error: Error;
};
declare class LeafDB<T extends Draft> {
    static id(): string;
    private readonly _memory;
    private _storage?;
    private _set;
    /** Get all documents */
    get docs(): Array<Doc<T>>;
    constructor();
    /** Read existing file and store to internal memory */
    open(options: StorageOptions): Promise<Corrupt[]>;
    /** Close file */
    close(): Promise<void | undefined>;
    /** Get document by `id` */
    get(id: string): Doc<T> | null;
    /** Create new document, throws if document already exists */
    insert(draft: T & {
        _id?: string;
    }): Promise<Doc<T>>;
    /** Find document by query */
    query(query: Query<T>): Array<Doc<T>>;
    /** Update document, throws if document does not exist */
    update(doc: Doc<T>): Promise<void>;
    /** Delete document by `id` */
    delete(id: string): Promise<void>;
    /** Delete all documents */
    drop(): Promise<void>;
}

export { Corrupt, Doc, Draft, Json, Query, StorageOptions, LeafDB as default };
