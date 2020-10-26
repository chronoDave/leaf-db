"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMixedModifiers = exports.hasModifiers = exports.isInvalidDoc = exports.isQueryMatch = exports.isEmptyObject = exports.isObject = exports.isNumber = void 0;
var fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
var lodash_get_1 = __importDefault(require("lodash.get"));
// Utils
var utils_1 = require("./utils");
// Basic
exports.isNumber = function (any) { return typeof any === 'number'; };
exports.isObject = function (any) { return any !== null && !Array.isArray(any) && typeof any === 'object'; };
exports.isEmptyObject = function (object) { return Object.keys(object).length === 0; };
// Operator
var operator = {
    gt: function (a, b) {
        if (!exports.isNumber(a) || !exports.isNumber(b))
            return false;
        return a > b;
    },
    gte: function (a, b) {
        if (!exports.isNumber(a) || !exports.isNumber(b))
            return false;
        return a >= b;
    },
    lt: function (a, b) {
        if (!exports.isNumber(a) || !exports.isNumber(b))
            return false;
        return a < b;
    },
    lte: function (a, b) {
        if (!exports.isNumber(a) || !exports.isNumber(b))
            return false;
        return a <= b;
    },
    not: function (a, b) { return a !== b; },
    exists: function (object, keys) { return keys
        .filter(function (key) {
        if (typeof key === 'boolean')
            return false;
        if (typeof key === 'object')
            return false;
        return lodash_get_1.default(object, key) !== undefined;
    })
        .length === keys.length; },
    has: function (array, value) { return array
        .some(function (item) { return fast_deep_equal_1.default(item, value); }); }
};
/**
 * Test if query matches
 * @param {object} query
 * @param {object} object
 */
exports.isQueryMatch = function (object, query) { return Object
    .entries(query)
    .filter(function (_a) {
    var _b = __read(_a, 2), key = _b[0], value = _b[1];
    // Operators
    if (key[0] === '$') {
        for (var j = 0, ofe = Object.entries(value); j < ofe.length; j += 1) {
            var _c = __read(ofe[j], 2), field = _c[0], testValue = _c[1];
            var originalValue = lodash_get_1.default(object, field); // Object value
            switch (key) {
                case '$gt':
                    if (typeof originalValue !== 'number')
                        return false;
                    if (!operator.gt(originalValue, testValue))
                        return false;
                    break;
                case '$gte':
                    if (typeof originalValue !== 'number')
                        return false;
                    if (!operator.gte(originalValue, testValue))
                        return false;
                    break;
                case '$lt':
                    if (typeof originalValue !== 'number')
                        return false;
                    if (!operator.lt(originalValue, testValue))
                        return false;
                    break;
                case '$lte':
                    if (typeof originalValue !== 'number')
                        return false;
                    if (!operator.lte(originalValue, testValue))
                        return false;
                    break;
                case '$not':
                    if (!operator.not(originalValue, testValue))
                        return false;
                    break;
                case '$exists':
                    if (!operator.exists(object, utils_1.toArray(value)))
                        return false;
                    break;
                case '$has':
                    if (!Array.isArray(originalValue))
                        return false;
                    if (!operator.has(originalValue, testValue))
                        return false;
                    break;
                default:
                    throw new Error("Invalid operator: " + key);
            }
        }
        // Regular
    }
    else if (!fast_deep_equal_1.default(lodash_get_1.default(object, key), value)) {
        return false;
    }
    // Does match
    return true;
})
    .length === Object.keys(query).length; };
exports.isInvalidDoc = function (doc) { return utils_1.objectHas(doc, function (_a) {
    var key = _a.key, value = _a.value;
    if (key[0] === '$')
        return true;
    if (key.includes('.'))
        return true;
    if (value === undefined)
        return true;
    return false;
}); };
/** Validate if object has modifier fields */
exports.hasModifiers = function (object) { return utils_1.objectHas(object, function (_a) {
    var key = _a.key;
    return key[0] === '$';
}); };
/** Validate if object has keys and modifiers */
exports.hasMixedModifiers = function (object) { return (exports.hasModifiers(object) &&
    Object.keys(object).filter(function (key) { return key[0] === '$'; }).length !== Object.keys(object).length); };
