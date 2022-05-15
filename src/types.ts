export type Join<T extends Array<string | number | Symbol>> = T[number];
export type KeysOf<T extends Record<string, unknown>> = Array<keyof T>;
export type OneOrMore<T> = T | T[];
export type Projection<T extends Record<string, unknown>, P extends KeysOf<T>> = Pick<T, Join<P>>;

export type Doc<T extends Record<string, unknown>> = T & {
  readonly _id: string
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
  $push: Record<string, Record<string, unknown>>
  $set: Record<string, Record<string, unknown>>
  $add: Record<string, number>
};

export type Query = Record<string, unknown> & Partial<Operators>;
export type Update<T> = T | Partial<Modifiers>;
