export type Struct = { [key: string]: Json };

export type Json =
  string |
  number |
  boolean |
  null |
  Json[] |
  { [key: string]: Json };

export type Join<T extends Array<string | number | Symbol>> = T[number];

export type Draft = { _id?: string } & {
  [key: string]: Json
  [operator: `$${string}`]: never
  [property: `__${string}`]: never
};

export type Doc<T extends Draft> = T & {
  readonly _id: string
  readonly __deleted?: boolean
};

export type Operators = {
  // Number
  $gt: number
  $gte: number
  $lt: number
  $lte: number
  // Text
  $text: string
  $regex: RegExp
  // Array
  $has: Json
  $size: number
  // Logic
  $not: Json
};

export type Modifiers = {
  $push: Record<string, Record<string, unknown>>
  $set: Record<string, Record<string, unknown>>
  $add: Record<string, number>
};

export type Query<T extends Struct> = Partial<{
  [K in keyof T]: T[K] extends Struct ?
    Query<T[K]> :
    T[K] | Partial<Operators>
}>;

export type Update<T extends Draft> = T | Partial<Modifiers>;
