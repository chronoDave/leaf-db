export declare const toArray: <T>(any: T | T[]) => T[];
/**
 * Generate unique ID
 * @param {number} length - ID length (can be shorter if ID contains invalid characters)
 * */
export declare const getUid: (length?: number) => string;
/**
 * Check if `object` has `key` or `value`
 * @param {object} object
 * @param {object} options
 * @param {function} validator - `validator({ key, value }) => Boolean`
 */
export declare const objectHas: (object: object, validator: ({ key, value }: {
    key: string;
    value: unknown;
}) => boolean) => boolean;
