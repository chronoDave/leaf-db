// Helpers
export type Join<T extends Array<string | number | Symbol>> = T[number];

// Base
export type Json =
  string |
  number |
  boolean |
  null |
  Json[] |
  { [key: string]: Json };

export type JsonObject = { [key: string]: Json };

// Leaf-DB
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

export type Draft = { _id?: string } & {
  [key: string]: Json
  [key: `$${string}`]: never
  [key: `__${string}`]: never
};

export type Doc<T extends Draft> = T & {
  readonly _id: string
  readonly __deleted?: boolean
};

export type Query<T> = Partial<{
  [K in keyof T]: T[K] extends JsonObject ?
    Query<T[K]> :
    T[K] | Partial<Operators>
}>;

export type Update<T> = Partial<{
  [K in keyof T]?: T[K] extends object ?
    Update<T[K]> :
    T[K]
}>;
