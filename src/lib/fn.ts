/**
 * Check if `a` is a subset of `b`
 * 
 * @see https://en.wikipedia.org/wiki/Subset
 * */
export const subset = (b: unknown) =>
  (a: unknown): boolean => {
    if (Array.isArray(b)) {
      if (Array.isArray(a)) return a.every(v => b.includes(v) || subset(b)(v));
      return b.some(v => subset(v)(a));
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
      return Object.keys(a).every(k => {
        if (!Object.hasOwn(b, k)) return false;
        return subset(b[k as keyof typeof b])(a[k as keyof typeof a]);
      });
    }

    return a === b;
  };

/** Check if `a` and `b` are deep equal */
export const equals = (a: unknown) =>
  (b: unknown): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      return a.every((v, i) => equals(b[i])(v));
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const keys = Object.keys(a);

      if (keys.length !== Object.keys(b).length) return false;
      return keys.every(k => equals(b[k as keyof typeof b])(a[k as keyof typeof a]));
    }

    return a === b;
  };
