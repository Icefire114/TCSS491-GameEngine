/**
 * Clamps the given number between the given bounds.
 * 
 * @param value The number to clamp
 * @param min The lower bound to clamp by
 * @param max The upper bound to clamp by
 * @returns The number `value` clamped by the lower and upper bounds
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Basically just rust's Option.unwrap().
 * @param v The value to unwrap.
 * @param msg Optional message to throw if the unwrap fails.
 * @returns `v` if it is a value
 * @throws An error if `v` is null or undefined
 */
export function unwrap<T>(v: T | undefined | null, msg?: string): T {
    if (v === undefined || v === null) {
        throw new Error(`unwrap was called on a null or undefined value! ${msg}`);
    }
    return v;
}

/**
 * Samples a random element from the given array.
 * @param arr The array to sample a random element from.
 * @returns A random element from the array
 */
export function randomOf<T>(arr: readonly [T, ...T[]]): T;

/**
 * Samples a random element from the given array.
 * @param arr The array to sample a random element from.
 * @returns A random element from the array or undefined if the array is empty
 */
export function randomOf<T>(arr: readonly T[]): T | undefined;

/**
 * Samples a random element from the given array.
 * @param arr The array to sample a random element from.
 * @param fallback The element to return if the array is empty.
 * @returns A random element from the array or `fallback` if the array is empty
 */
export function randomOf<T>(arr: readonly T[], fallback: T): T;

/**
 * Samples a random element from the given array.
 * @param arr The array to sample a random element from.
 * @param fallback The element to return if the array is empty.
 * @returns A random element from the array or `fallback` if the array is empty
 */
export function randomOf<T>(arr: readonly T[], fallback?: T): T | undefined {
    if (arr.length === 0) return fallback;
    return arr[Math.floor(Math.random() * arr.length)];
}