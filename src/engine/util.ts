/**
 * Sleeps for the given number of miliseconds.
 * @param ms The number of miliseconds to sleep for
 */
export async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

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
 * @returns `v` if it is a value
 * @throws An error if `v` is null or undefined
 */
export function unwrap<T>(v: T | undefined | null): T {
    if (v === undefined || v === null) {
        throw new Error("unwrap was called on a null or undefined value!");
    }
    return v;
}
