import Rand from "rand-seed";

export const g_RNG = new Rand("my-cool-seed");

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
 * Converts the given angle in radians to degrees.
 * @param r The angle in radians
 * @returns The angle in degrees
 */
export function RtoD(r: number): number {
    return r * (180 / Math.PI);
}

/**
 * Converts the given angle in degrees to radians.
 * @param d The angle in degress
 * @returns The angle in radians
 */
export function DtoR(d: number): number {
    return d * (Math.PI / 180);
}


/**
 * Picks a random element from the given options with their weights.
 *
 * @param options  The possible options to choose from with their weights.
 * @param rng      Optional RNG to use, else defaults to `g_RNG`.
 */
export function randomOfWeighted<T>(
    options: readonly { obj: T; weight: number }[],
    rng?: Rand
): T | undefined;

/**
 * Picks a random element from the given options with their weights.
 *
 * @param options  The possible options to choose from with their weights.
 * @param fallback The element to return if the array is empty or total weight is 0.
 * @param rng      Optional RNG to use, else defaults to `g_RNG`.
 */
export function randomOfWeighted<T>(
    options: readonly { obj: T; weight: number }[],
    fallback: T,
    rng?: Rand
): T;

export function randomOfWeighted<T>(
    options: readonly { obj: T; weight: number }[],
    fallbackOrRng?: T | Rand,
    maybeRng?: Rand
): T | undefined {
    const rng: Rand = maybeRng ?? (fallbackOrRng instanceof Rand ? fallbackOrRng : g_RNG);

    const fallback: T | undefined = fallbackOrRng instanceof Rand ? undefined : fallbackOrRng;

    let totalWeight = 0;
    for (const opt of options) {
        const w = Math.max(0, opt.weight);
        if (w !== opt.weight) {
            console.warn('Negative weight encountered:', opt);
        }
        totalWeight += w;
    }

    if (totalWeight <= 0) return fallback;

    let roll = rng.next() * totalWeight;
    for (const opt of options) {
        roll -= Math.max(0, opt.weight);
        if (roll <= 0) return opt.obj;
    }

    return fallback;
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
    return arr[Math.floor(g_RNG.next() * arr.length)];
}