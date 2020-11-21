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
exports.objectProject = exports.objectModify = void 0;
var lodash_get_1 = __importDefault(require("lodash.get"));
var lodash_set_1 = __importDefault(require("lodash.set"));
var modifiers = {
    add: function (object, key, value) {
        if (typeof lodash_get_1.default(object, key) !== 'number' ||
            typeof value !== 'number' ||
            !lodash_get_1.default(object, key))
            return object;
        return lodash_set_1.default(object, key, lodash_get_1.default(object, key) + value);
    },
    set: function (object, key, value) { return lodash_set_1.default(object, key, value); },
    push: function (object, key, value) {
        if (!Array.isArray(lodash_get_1.default(object, key)))
            return object;
        return lodash_set_1.default(object, key, __spread(lodash_get_1.default(object, key), [value]));
    }
};
exports.objectModify = function (object, update) {
    for (var i = 0, ue = Object.entries(update); i < ue.length; i += 1) {
        var _a = __read(ue[i], 2), modifier = _a[0], fields = _a[1];
        for (var j = 0, fe = Object.entries(fields || {}); j < fe.length; j += 1) {
            var _b = __read(fe[j], 2), key = _b[0], value = _b[1];
            switch (modifier) {
                case '$add':
                    return modifiers.add(object, key, value);
                case '$set':
                    return modifiers.set(object, key, value);
                case '$push':
                    return modifiers.push(object, key, value);
                default:
                    throw new Error("Invalid modifier: " + modifier);
            }
        }
    }
    return object;
};
exports.objectProject = function (object, projection) {
    if (!object)
        return null;
    if (!projection)
        return object;
    if (!Array.isArray(projection)) {
        throw new Error("Invalid projection, must be of type 'Array' or falsy: " + projection);
    }
    if (projection.length === 0)
        return {};
    if (projection.some(function (key) { return typeof key !== 'string' || key[0] === '$'; })) {
        throw new Error("Invalid projection, contains invalid key: " + projection);
    }
    return projection
        .reduce(function (acc, key) { return lodash_set_1.default(acc, key, lodash_get_1.default(object, key)); }, {});
};
