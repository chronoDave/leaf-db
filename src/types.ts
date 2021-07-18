export type Join<T extends Array<string | number | Symbol>> = T[number];
export type KeysOf<T extends object> = Array<keyof T>;
export type OneOrMore<T> = T | T[];
export type Projection<T extends object, P extends KeysOf<T>> = Pick<T, Join<P>>;

export type Doc<T extends object> = T & { _id?: string };
export type DocPrivate<T extends object> = Doc<T> & {
  readonly _id: string,
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
  $push: Record<string, object>
  $set: Record<string, object>
  $add: Record<string, number>
};

export type Query = object & Partial<Operators>;
export type Update<T> = T | Partial<Modifiers>;
