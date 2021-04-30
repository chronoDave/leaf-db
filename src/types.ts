export type Value = number | string | boolean | object;

export type OneOrMore<T> = T | T[];

export type Doc = {
  _id: string,
  $deleted?: boolean
} & Partial<Record<string, OneOrMore<Value>>>;

export type PartialDocs = Partial<Doc>[];

export type Query =
  Record<string, OneOrMore<Value>> &
  Partial<Record<'$gt' | '$gte' | '$lt' | '$lte' | '$not' | '$has', OneOrMore<Value>>> &
  Partial<Record<'$exists', string[]>>;

export type Projection = OneOrMore<string> | null;

export type Update = Partial<Doc> | {
  _id?: never
  $add?: Record<string, number>,
  $set?: Record<string, OneOrMore<Value>>
};
