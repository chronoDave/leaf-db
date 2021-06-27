export const filterNull = <T>(a: Array<T | null>) => a.flatMap(i => (i ? [i] : []));
