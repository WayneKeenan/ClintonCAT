/**
 * Returns an array of the object's own enumerable property names.
 * type-safe version of Object.keys
 * @param obj
 */
function objectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export default objectKeys;
