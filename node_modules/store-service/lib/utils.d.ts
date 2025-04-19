declare namespace utils {
    /**
     * Looks up the dot path of an object
     * @param obj the object to look at
     * @param path the dot path to retreive
     */
    function lookup<T = any>(obj: any, path: string): T | null;
    /**
     * sets a value on an arbitrary object
     * @param obj
     * @param path
     * @param value
     */
    function set(obj: any, path: string, value: any): void;
    /**
     * converts an alpha-numeric string to PascalCase for dictionary indexing
     * @param key key a string for converting to PascalCase
     * @returns a PascalCase string
     */
    function pascalCase(key: string): string;
    /**
     * @returns true if string is pascal case
     */
    function isPascalCase(s: string): boolean;
    /**
     * @returns true if string `is.a.dot.path`
     */
    function isDotPath(s: string): boolean;
    /**
     * checks to see if value are equivalent up to a certain depth
     * uses strict equality under the specified depth
     * @param a the first of the two values to compare
     * @param b the second of the two values to compare
     * @param depth the depth to compare
     * @returns true if the values / structures match
     */
    function valuesMatch(src: any, dest: any, depth?: number): boolean;
    /**
     * @deprecated use valuesMatch
     */
    const objectsMatch: typeof valuesMatch;
    function collectKeys(...objs: Array<Record<string, any>>): string[];
    /**
     * Calculates the difference between two object/value structures
     * @param src the first state of the object/value
     * @param dest the second state of the object/value
     * @param depth the depth to compare, performs reference match beyond depth
     * @returns the structured differences, new value or undefined if the same
     */
    function valueDiff<T = any>(src: T, dest: T, depth?: number): Partial<T> | undefined;
    function clone<T = any>(obj: T, maxDepth?: number): T;
    /**
     * converts an arbitrary alpha-numeric string into an
     * array of words
     * @param key a string for converting to words
     * @returns an array of words
     */
    function toWords(key: string): string[];
}
export default utils;
