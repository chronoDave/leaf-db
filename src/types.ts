export type Value = number | string | boolean | { [key: string]: Value } | Value[];

export type OneOrMore<T> = T | T[];

export type Doc = {
  _id: string,
  $deleted?: boolean
} & Partial<Record<string, Value>>;

export type Query =
  Record<string, Value> &
  Partial<Record<'$gt' | '$gte' | '$lt' | '$lte', number>> &
  Partial<Record<'$string' | '$stringStrict', string>> &
  Partial<Record<'$exists', string[]>> &
  Partial<Record<'$not', Value>> &
  Partial<Record<'$has', Value[]>>;

export type Projection = OneOrMore<string> | null;

export type Update = Partial<Doc> | {
  _id: never
  $add?: Record<string, number>,
  $set?: Record<string, OneOrMore<Value>>
};
