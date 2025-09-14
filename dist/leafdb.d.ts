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
    private readonly _storage?;
    get docs(): Array<Doc<T>>;
    constructor(options?: StorageOptions);
    open(): Promise<Corrupt[]>;
    close(): Promise<void | undefined>;
    get(id: string): Doc<T> | null;
    set(draft: T & {
        _id?: string;
    }): Promise<string>;
    query(query: Query<T>): Array<Doc<T>>;
    delete(id: string): Promise<void>;
    drop(): Promise<void>;
}

export { Corrupt, Doc, Draft, Json, Query, StorageOptions, LeafDB as default };
