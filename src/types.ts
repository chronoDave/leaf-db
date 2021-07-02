// Helpers
export type OneOrMore<T> = T | T[];
export type Never<T> = { [P in keyof T]?: undefined };

// LeafDB
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
  $includes: Record<string, unknown>
  $not: Record<string, unknown>
  $keys: string[]
  $or: Query[]
};

export type Modifiers = {
  $push: Record<string, Doc>
  $set: Record<string, Doc>
  $add: Record<string, number>
};

export type Query = Doc & Partial<Operators>;
export type Projection = string[];
export type Update = Doc | Partial<Modifiers>;

export type DocBase = Record<string, unknown> & { _id?: string };
export type Doc =
  DocBase &
  Never<Tags> &
  Never<Operators> &
  Never<Modifiers>;

// Internal
export type DocInternal<T extends Doc> = T & { readonly _id: string } & Tags;
