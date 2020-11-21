"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
// Modifiers
var modifiers_1 = require("./modifiers");
// Utils
var utils_1 = require("./utils");
// Validation
var validation_1 = require("./validation");
var LeafDB = /** @class */ (function () {
    function LeafDB(name, options) {
        if (options === void 0) { options = {}; }
        this.root = options.root;
        this.strict = !!options.strict;
        if (this.root)
            fs_1.default.mkdirSync(this.root, { recursive: true });
        this.data = {};
        this.file = (this.root && name) && path_1.default.resolve(this.root, name + ".txt");
        if (this.root &&
            (typeof options.autoload === 'undefined' ? true : options.autoload))
            this.load();
    }
    /**
     * Initialize database
     * @returns {string[]} List of corrupt items
     * */
    LeafDB.prototype.load = function () {
        var corrupted = [];
        if (!this.file)
            return corrupted;
        if (!this.root) {
            throw new Error('Cannot load file data with an in-memory database');
        }
        if (fs_1.default.existsSync(this.file)) {
            this.data = {};
            var data = fs_1.default
                .readFileSync(this.file, 'utf-8')
                .split('\n');
            for (var i = 0; i < data.length; i += 1) {
                var raw = data[i];
                if (raw && raw.length > 0) {
                    try {
                        var doc = JSON.parse(raw, function (_, value) { return (typeof value !== 'string' ?
                            value :
                            value
                                .replace(/\\/g, '\u005c')
                                .replace(/"/g, '\u0022')); });
                        if (!doc._id)
                            throw new Error("Missing field '_id': " + doc);
                        this.data[doc._id] = doc;
                    }
                    catch (err) {
                        if (this.strict)
                            throw err;
                        corrupted.push(raw);
                    }
                }
            }
        }
        else {
            fs_1.default.writeFileSync(this.file, '');
        }
        return corrupted;
    };
    /**
     * Persist database
     * @param {object} data - Hash table (default `this.data`)
     * */
    LeafDB.prototype.persist = function (data) {
        if (data === void 0) { data = this.data; }
        if (!this.file) {
            throw new Error('Tried to call `persist()` in memory mode');
        }
        var payload = [];
        for (var i = 0, docs = Object.values(data); i < docs.length; i += 1) {
            try {
                var doc = docs[i];
                if (!doc.$deleted)
                    payload.push(JSON.stringify(doc));
            }
            catch (err) {
                if (this.strict)
                    throw err;
            }
        }
        fs_1.default.writeFileSync(this.file, payload.join('\n'));
    };
    /**
     * Insert new document(s)
     * @param {object|object[]} newDocs
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     * */
    LeafDB.prototype.insert = function (newDocs, _a) {
        var _b = (_a === void 0 ? {} : _a).persist, persist = _b === void 0 ? false : _b;
        if (!Array.isArray(newDocs) && !validation_1.isObject(newDocs)) {
            return Promise.reject(new Error("Invalid newDocs: " + JSON.stringify(newDocs)));
        }
        var inserted = [];
        for (var i = 0, a = utils_1.toArray(newDocs); i < a.length; i += 1) {
            var newDoc = a[i];
            if (!validation_1.isObject(newDoc)) {
                return Promise.reject(new Error("newDoc is not an object (" + typeof newDoc + "): " + JSON.stringify(newDoc)));
            }
            if (validation_1.isInvalidDoc(newDoc)) {
                return Promise.reject(new Error("newDoc is not a valid document: " + JSON.stringify(newDoc)));
            }
            if (!newDoc._id)
                newDoc._id = utils_1.getUid();
            if (this.data[newDoc._id]) {
                return Promise.reject(new Error("'_id' already exists: " + newDoc._id + ", " + JSON.stringify(this.data[newDoc._id])));
            }
            inserted.push(newDoc);
        }
        for (var i = 0; i < inserted.length; i += 1) {
            var newDoc = inserted[i];
            this.data[newDoc._id] = newDoc;
        }
        if (persist)
            this.persist();
        return Promise.resolve(inserted);
    };
    /**
     * Find doc(s) matching `_id`
     * @param {string|string[]} _id - Doc _id
     * @param {string[]} projection - Projection array (default `null`)
     * */
    LeafDB.prototype.findById = function (_id, projection) {
        if (projection === void 0) { projection = null; }
        try {
            var payload = [];
            for (var i = 0, keys = utils_1.toArray(_id); i < keys.length; i += 1) {
                var key = keys[i];
                if (!key || typeof key !== 'string') {
                    return Promise.reject(new Error("Invalid _id: " + key));
                }
                var doc = this.data[key];
                if (doc && !doc.$deleted)
                    payload.push(modifiers_1.objectProject(doc, projection));
            }
            return Promise.resolve(payload);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /**
     * Find all documents matching `query`
     * @param {string|object} query - Query object (default `{}`)
     * @param {string[]} projection - Projection array (default `null`)
     */
    LeafDB.prototype.find = function (query, projection) {
        if (query === void 0) { query = {}; }
        if (projection === void 0) { projection = null; }
        try {
            if (!query || !validation_1.isObject(query)) {
                return Promise.reject(new Error("Invalid query: " + JSON.stringify(query)));
            }
            if (validation_1.isEmptyObject(query)) {
                return Promise.resolve(Object
                    .values(this.data)
                    .map(function (doc) { return modifiers_1.objectProject(doc, projection); }));
            }
            var payload = [];
            for (var i = 0, data = Object.values(this.data); i < data.length; i += 1) {
                var doc = data[i];
                if (!doc.$deleted && validation_1.isQueryMatch(doc, query)) {
                    payload.push(modifiers_1.objectProject(doc, projection));
                }
            }
            return Promise.resolve(payload);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /**
     * Update single doc matching `_id`
     * @param {string} _id
     * @param {object} update - New document (default `{}`) / Update query
     * @param {object} options
     * @param {string[]} options.projection - Projection array (default `null`)
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
    */
    LeafDB.prototype.updateById = function (_id, update, options) {
        if (update === void 0) { update = {}; }
        if (options === void 0) { options = {
            projection: null,
            persist: false
        }; }
        try {
            if (!validation_1.isObject(update) ||
                update._id ||
                validation_1.hasMixedModifiers(update) ||
                (!validation_1.hasModifiers(update) && validation_1.isInvalidDoc(update))) {
                return Promise.reject(new Error("Invalid update: " + JSON.stringify(update)));
            }
            var payload = [];
            for (var i = 0, keys = utils_1.toArray(_id); i < keys.length; i += 1) {
                var key = keys[i];
                if (!key || typeof key !== 'string') {
                    return Promise.reject(new Error("Invalid _id: " + key));
                }
                var doc = this.data[key];
                if (doc && !doc.$deleted) {
                    var newDoc = validation_1.hasModifiers(update) ?
                        modifiers_1.objectModify(doc, update) :
                        update;
                    this.data[key] = __assign(__assign({}, newDoc), { _id: key });
                    payload.push(modifiers_1.objectProject(__assign(__assign({}, newDoc), { _id: key }), options.projection));
                }
            }
            if (options.persist)
                this.persist();
            return Promise.resolve(payload);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /**
     * Update documents matching `query`
     * @param {string|object} query - Query object (default `{}`)
     * @param {object} update - New document (default `{}`) / Update query
     * @param {object} options
     * @param {string[]} options.projection - Projection array (default `null`)
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     */
    LeafDB.prototype.update = function (query, update, options) {
        if (query === void 0) { query = {}; }
        if (update === void 0) { update = {}; }
        if (options === void 0) { options = {
            projection: null,
            persist: false
        }; }
        try {
            if (!validation_1.isObject(query)) {
                return Promise.reject(new Error("Invalid query: " + JSON.stringify(query)));
            }
            if (!validation_1.isObject(update) ||
                update._id ||
                validation_1.hasMixedModifiers(update) ||
                (!validation_1.hasModifiers(update) && validation_1.isInvalidDoc(update))) {
                return Promise.reject(new Error("Invalid update: " + JSON.stringify(update)));
            }
            var payload = [];
            for (var i = 0, k = Object.keys(this.data); i < k.length; i += 1) {
                var _id = k[i];
                var doc = this.data[_id];
                if (!doc.$deleted && validation_1.isQueryMatch(doc, query)) {
                    var newDoc = validation_1.hasModifiers(update) ?
                        modifiers_1.objectModify(doc, update) :
                        update;
                    this.data[_id] = __assign(__assign({}, newDoc), { _id: _id });
                    payload.push(modifiers_1.objectProject(__assign(__assign({}, newDoc), { _id: _id }), options.projection));
                }
            }
            if (options.persist)
                this.persist();
            return Promise.resolve(payload);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /**
     * Delete doc matching `_id`
     * @param {string} _id
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
    */
    LeafDB.prototype.deleteById = function (_id, _a) {
        var _b = (_a === void 0 ? {} : _a).persist, persist = _b === void 0 ? false : _b;
        try {
            var deleted = 0;
            for (var i = 0, keys = utils_1.toArray(_id); i < keys.length; i += 1) {
                var key = keys[i];
                if (!key || typeof key !== 'string') {
                    return Promise.reject(new Error("Invalid _id: " + key));
                }
                var doc = this.data[key];
                if (doc && !doc.$deleted) {
                    this.data[key] = __assign(__assign({}, doc), { $deleted: true });
                    deleted += 1;
                }
            }
            if (persist)
                this.persist();
            return Promise.resolve(deleted);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /**
     * Delete documents matching `query`
     * @param {*} query - Query object (default `{}`)
     * @param {object} options
     * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
     */
    LeafDB.prototype.delete = function (query, _a) {
        if (query === void 0) { query = {}; }
        var _b = (_a === void 0 ? {} : _a).persist, persist = _b === void 0 ? false : _b;
        try {
            if (!validation_1.isObject(query)) {
                return Promise.reject(new Error("Invalid query: " + JSON.stringify(query)));
            }
            var removed = 0;
            for (var i = 0, k = Object.keys(this.data); i < k.length; i += 1) {
                var _id = k[i];
                var doc = this.data[_id];
                if (!doc.$deleted && validation_1.isQueryMatch(doc, query)) {
                    this.data[_id] = __assign(__assign({}, doc), { $deleted: true });
                    removed += 1;
                }
            }
            if (persist)
                this.persist();
            return Promise.resolve(removed);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    /** Drop database */
    LeafDB.prototype.drop = function () {
        this.data = {};
        if (this.file)
            this.persist();
        return Promise.resolve();
    };
    return LeafDB;
}());
exports.default = LeafDB;
