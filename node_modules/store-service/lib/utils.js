"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils;
(function (utils) {
    /**
     * Looks up the dot path of an object
     * @param obj the object to look at
     * @param path the dot path to retreive
     */
    function lookup(obj, path) {
        if (path.match(/\s/)) {
            throw new Error("Invalid object path " + path);
        }
        let result = obj;
        if (obj) {
            const pathBits = path.trim().split(".");
            for (const pathBit of pathBits) {
                result = result[pathBit];
                if (!result) {
                    break;
                }
            }
        }
        return typeof result !== "undefined" ? result : null;
    }
    utils.lookup = lookup;
    /**
     * sets a value on an arbitrary object
     * @param obj
     * @param path
     * @param value
     */
    function set(obj, path, value) {
        if (isDotPath(path) === false) {
            throw new Error("Invalid object path " + path);
        }
        const lastDotI = path.lastIndexOf(".");
        let key = path;
        if (lastDotI >= 0) {
            const subpath = path.substr(0, lastDotI);
            key = path.substr(lastDotI + 1);
            obj = lookup(obj, subpath);
        }
        if (!obj) {
            throw new Error("Can't set property on object at path " + path);
        }
        obj[key] = value;
    }
    utils.set = set;
    const CCA = "a".charCodeAt(0);
    const CCZ = "z".charCodeAt(0);
    const CC0 = "0".charCodeAt(0);
    const CC9 = "9".charCodeAt(0);
    function isAlphaNum(c) {
        const n = c.charCodeAt(0);
        return (n >= CC0 && n <= CC9) || (n >= CCA && n <= CCZ);
    }
    /**
     * converts an alpha-numeric string to PascalCase for dictionary indexing
     * @param key key a string for converting to PascalCase
     * @returns a PascalCase string
     */
    function pascalCase(key) {
        return toWords(key).map(w => (w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())).join("");
    }
    utils.pascalCase = pascalCase;
    /**
     * @returns true if string is pascal case
     */
    function isPascalCase(s) {
        return s === pascalCase(s);
    }
    utils.isPascalCase = isPascalCase;
    /**
     * @returns true if string `is.a.dot.path`
     */
    function isDotPath(s) {
        return !s.match(/[^0-9A-Za-z\.]/);
    }
    utils.isDotPath = isDotPath;
    /**
     * checks to see if value are equivalent up to a certain depth
     * uses strict equality under the specified depth
     * @param a the first of the two values to compare
     * @param b the second of the two values to compare
     * @param depth the depth to compare
     * @returns true if the values / structures match
     */
    function valuesMatch(src, dest, depth = 3) {
        const diff = valueDiff(src, dest, depth);
        return diff === undefined;
    }
    utils.valuesMatch = valuesMatch;
    /**
     * @deprecated use valuesMatch
     */
    utils.objectsMatch = valuesMatch;
    function collectKeys(...objs) {
        const keys = {};
        for (const obj of objs) {
            if (!obj || typeof obj !== "object") {
                continue;
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    keys[key] = true;
                }
            }
        }
        const result = [];
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                result.push(key);
            }
        }
        return result;
    }
    utils.collectKeys = collectKeys;
    /**
     * Calculates the difference between two object/value structures
     * @param src the first state of the object/value
     * @param dest the second state of the object/value
     * @param depth the depth to compare, performs reference match beyond depth
     * @returns the structured differences, new value or undefined if the same
     */
    function valueDiff(src, dest, depth = 3) {
        if (typeof src === "string" || typeof src === "number" || typeof src === "boolean") {
            return src === dest ? undefined : dest;
        }
        if (typeof src === "function" || src instanceof Date) {
            return String(src) === String(dest) ? undefined : dest;
        }
        if ((src === null) !== (dest === null)) {
            return dest;
        }
        if (typeof src === "object") {
            if (typeof dest !== "object") {
                return dest;
            }
            const result = {};
            const allKeys = collectKeys(src, dest);
            for (const key of allKeys) {
                if (src.hasOwnProperty(key) === false) {
                    result[key] = dest[key];
                    continue;
                }
                if (dest.hasOwnProperty(key) === false) {
                    result[key] = undefined;
                    continue;
                }
                if (depth > 0) {
                    const subdif = valueDiff(src[key], dest[key], depth - 1);
                    if (subdif !== undefined) {
                        result[key] = subdif;
                        continue;
                    }
                }
                else {
                    if (String(src[key]) !== String(dest[key])) {
                        result[key] = dest[key];
                        continue;
                    }
                }
            }
            if (collectKeys(result).length > 0) {
                return result;
            }
        }
        return undefined;
    }
    utils.valueDiff = valueDiff;
    function clone(obj, maxDepth = 3) {
        return valueDiff({}, obj, maxDepth);
    }
    utils.clone = clone;
    /**
     * converts an arbitrary alpha-numeric string into an
     * array of words
     * @param key a string for converting to words
     * @returns an array of words
     */
    function toWords(key) {
        if (typeof key !== "string") {
            throw new Error("Invalid key string " + key);
        }
        const result = [];
        let word = "";
        for (let i = 0; i < key.length; i++) {
            const c = key.charAt(i);
            if (!isAlphaNum(c.toLowerCase())) {
                continue;
            }
            word += c;
            const p = key.charAt(i + 1);
            if (word.length > 0 && isAlphaNum(c) && !isAlphaNum(p)) {
                result.push(word);
                word = "";
            }
        }
        if (word) {
            result.push(word);
        }
        return result;
    }
    utils.toWords = toWords;
})(utils || (utils = {}));
exports.default = utils;
