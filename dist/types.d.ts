export declare type Value = number | string | boolean | object;
export declare type Doc = {
    _id: string;
    $deleted?: boolean;
} & {
    [key: string]: Value | Array<Value>;
};
export declare type NewDoc = Doc & {
    _id?: string;
};
export declare type Query = {
    [key: string]: Value | Array<Value>;
} & {
    $gt?: {
        [key: string]: Value | Array<Value>;
    };
    $gte?: {
        [key: string]: Value | Array<Value>;
    };
    $lt?: {
        [key: string]: Value | Array<Value>;
    };
    $lte?: {
        [key: string]: Value | Array<Value>;
    };
    $not?: {
        [key: string]: Value | Array<Value>;
    };
    $exists?: string | Array<string>;
    $has?: {
        [key: string]: Value | Array<Value>;
    };
};
export declare type Projection = string | Array<string> | null;
export declare type Update = {
    _id?: never;
    $add?: {
        [key: string]: number;
    };
    $set?: {
        [key: string]: Value | Array<Value>;
    };
};
