import { Doc, Query } from './types';
export declare const isNumber: (any: unknown) => boolean;
export declare const isObject: (any: unknown) => boolean;
export declare const isEmptyObject: (object: object) => boolean;
/**
 * Test if query matches
 * @param {object} query
 * @param {object} object
 */
export declare const isQueryMatch: (object: Doc, query: Query) => boolean;
export declare const isInvalidDoc: (doc: object) => boolean;
/** Validate if object has modifier fields */
export declare const hasModifiers: (object: object) => boolean;
/** Validate if object has keys and modifiers */
export declare const hasMixedModifiers: (object: object) => boolean;
