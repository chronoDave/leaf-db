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
