// Types
export type JSON = number | string | boolean | { [key: string]: JSON } | JSON[];

// Helpers
export type ValueOf<T> = T[keyof T];
export type OneOrMore<T> = T | T[];
export type Never<T> = { [Property in keyof T]?: never };

// LeafDB
export type DocBase = Record<string, JSON> & { _id?: string };
export type DocValue =
  DocBase &
  Never<Tags> &
  Never<Operators> &
  Never<Modifiers>;
export type Doc<T extends DocValue> = T & { readonly _id: string, $deleted?: boolean };

export type Tags = {
  $deleted?: boolean
};

export type Operators = {
  $gt: Record<string, number>
  $gte: Record<string, number>
  $lt: Record<string, number>
  $lte: Record<string, number>
  $string: Record<string, string>
  $stringStrict: Record<string, string>
  $includes: Record<string, JSON>
  $not: Record<string, JSON>
  $keys: string[]
  $or: Query[]
};

export type Modifiers = {
  $push: Record<string, DocValue>
  $set: Record<string, DocValue>
  $add: Record<string, number>
};

export type Query = DocValue & Partial<Operators>;
export type Projection = string[];
export type Update = DocValue | Partial<Modifiers>;
