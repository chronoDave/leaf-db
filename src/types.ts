export type Join<T extends Array<string | number | Symbol>> = T[number];

export type Draft = {
  _id?: string
  [key: string]: unknown
};

export type Doc<T extends Draft> = T & {
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
