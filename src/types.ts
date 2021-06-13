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
  $gt: number
  $gte: number
  $lt: number
  $lte: number
  $string: string
  $stringStrict: string
  $keys: string[]
  $includes: JSON[]
  $or: Query[]
  $not: JSON
};

export type Modifiers = {
  $add: Record<string, number>
  $push: DocValue
  $set: DocValue
};

export type Query = Partial<Operators> & DocValue;
export type Projection = string[];
export type Update<T extends DocValue> = T | Partial<Modifiers>;
