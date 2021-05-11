export type Value = number | string | boolean | { [key: string]: Value } | Value[];

export type ValueOf<T> = T[keyof T];

export type OneOrMore<T> = T | T[];

export type Doc = {
  readonly _id: string,
  $deleted?: boolean
} & Record<string, Value>;

export type NewDoc = { _id?: string } & Record<string, Value>;

export type Operators = {
  $gt: number,
  $gte: number,
  $lt: number,
  $lte: number,
  $string: string,
  $stringStrict: string,
  $keys: string[],
  $includes: Value[],
  $or: Query[],
  $not: Value
};

export type Query = Partial<Operators> & Record<string, Value>;

export type Projection = string[];

export type Modifiers = {
  $add: Record<string, number>,
  $push: Record<string, Value>,
  $set: Record<string, Value>
};

export type Update = NewDoc | Partial<Modifiers>;
