export type Join<T extends Array<string | number | symbol>> = T[number];
export type DeepPartial<T> = Partial<{
  [K in keyof T]?: T[K] extends object ?
    Update<T[K]> :
    T[K]
}>;

export type Update<T> = Omit<DeepPartial<T>, '__deleted' | '_id'>;
