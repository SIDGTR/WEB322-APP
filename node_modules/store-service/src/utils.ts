namespace utils {

  /**
   * Looks up the dot path of an object
   * @param obj the object to look at
   * @param path the dot path to retreive
   */
  export function lookup<T = any>(obj: any, path: string): T|null {
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

  /**
   * sets a value on an arbitrary object
   * @param obj
   * @param path
   * @param value
   */
  export function set(obj: any, path: string, value: any) {
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

  const CCA = "a".charCodeAt(0);
  const CCZ = "z".charCodeAt(0);
  const CC0 = "0".charCodeAt(0);
  const CC9 = "9".charCodeAt(0);
  function isAlphaNum(c: string) {
    const n = c.charCodeAt(0);
    return (n >= CC0 && n <= CC9) || (n >= CCA && n <= CCZ);
  }

  /**
   * converts an alpha-numeric string to PascalCase for dictionary indexing
   * @param key key a string for converting to PascalCase
   * @returns a PascalCase string
   */
  export function pascalCase(key: string) {
    return toWords(key).map(w => (
      w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()
    )).join("");
  }

  /**
   * @returns true if string is pascal case
   */
  export function isPascalCase(s: string) {
    return s === pascalCase(s);
  }

  /**
   * @returns true if string `is.a.dot.path`
   */
  export function isDotPath(s: string) {
    return !s.match(/[^0-9A-Za-z\.]/);
  }

  /**
   * checks to see if value are equivalent up to a certain depth
   * uses strict equality under the specified depth
   * @param a the first of the two values to compare
   * @param b the second of the two values to compare
   * @param depth the depth to compare
   * @returns true if the values / structures match
   */
  export function valuesMatch(src: any, dest: any, depth = 3): boolean {
    const diff = valueDiff(src, dest, depth);
    return diff === undefined;
  }

  /**
   * @deprecated use valuesMatch
   */
  export const objectsMatch = valuesMatch;

  export function collectKeys(...objs: Array<Record<string, any>>) {
    const keys: any = {};
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
    const result: string[] = [];
    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Calculates the difference between two object/value structures
   * @param src the first state of the object/value
   * @param dest the second state of the object/value
   * @param depth the depth to compare, performs reference match beyond depth
   * @returns the structured differences, new value or undefined if the same
   */
  export function valueDiff<T = any>(src: T, dest: T, depth = 3): Partial<T> | undefined {
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

      const result: Record<string, any> = {};

      const allKeys = collectKeys(src, dest);
      for (const key of allKeys) {
        if (src.hasOwnProperty(key) === false) {
          result[key] = (dest as any)[key];
          continue;
        }
        if (dest.hasOwnProperty(key) === false) {
          result[key] = undefined;
          continue;
        }
        if (depth > 0) {
          const subdif = valueDiff((src as any)[key], (dest as any)[key], depth - 1);
          if (subdif !== undefined) {
            result[key] = subdif;
            continue;
          }
        } else {
          if (String((src as any)[key]) !== String((dest as any)[key])) {
            result[key] = (dest as any)[key];
            continue;
          }
        }
      }
      if (collectKeys(result).length > 0) {
        return result as Partial<T>;
      }
    }
    return undefined;
  }

  export function clone<T = any>(obj: T, maxDepth = 3): T {
    return valueDiff({}, obj, maxDepth) as T;
  }

  /**
   * converts an arbitrary alpha-numeric string into an
   * array of words
   * @param key a string for converting to words
   * @returns an array of words
   */
  export function toWords(key: string) {
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
}

export default utils;
