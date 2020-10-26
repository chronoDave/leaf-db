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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectHas = exports.getUid = exports.toArray = void 0;
var crypto_1 = __importDefault(require("crypto"));
exports.toArray = function (any) { return (Array.isArray(any) ? any : [any]); };
/**
 * Generate unique ID
 * @param {number} length - ID length (can be shorter if ID contains invalid characters)
 * */
exports.getUid = function (length) {
    if (length === void 0) { length = 16; }
    return crypto_1.default
        .randomBytes(Math.ceil((length * 5) / 4))
        .toString('base64')
        .replace(/[+/]/g, '')
        .slice(0, length);
};
/**
 * Check if `object` has `key` or `value`
 * @param {object} object
 * @param {object} options
 * @param {function} validator - `validator({ key, value }) => Boolean`
 */
exports.objectHas = function (object, validator) {
    if (!object || typeof object !== 'object')
        return false;
    var stack = Object.entries(object);
    while (stack.length > 0) {
        var _a = __read(stack.pop(), 2), key = _a[0], value = _a[1];
        if (validator({ key: key, value: value }))
            return true;
        if (value && typeof value === 'object')
            stack.push.apply(stack, __spread(Object.entries(value)));
    }
    return false;
};
