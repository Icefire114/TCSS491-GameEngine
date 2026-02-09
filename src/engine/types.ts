export type DrawLayer = number & { __brand: "DrawLayer" };
export namespace DrawLayer {
    export const HIGHEST: DrawLayer = 1000000 as DrawLayer;

    export const SKY: DrawLayer = HIGHEST - 1 as DrawLayer;
    export const BACKGROUND: DrawLayer = SKY - 1 as DrawLayer;
    export const FOREGROUND: DrawLayer = BACKGROUND - 1 as DrawLayer;
    export const WORLD_DECORATION: DrawLayer = FOREGROUND - 1 as DrawLayer;
    export const MOUNTAIN_TERRAIN: DrawLayer = WORLD_DECORATION - 1 as DrawLayer;
    export const SPIKE: DrawLayer = MOUNTAIN_TERRAIN - 1 as DrawLayer;
    export const ZOMBIE: DrawLayer = SPIKE - 1 as DrawLayer;
    export const ITEM: DrawLayer = ZOMBIE - 1 as DrawLayer;
    export const PLAYER: DrawLayer = ITEM - 1 as DrawLayer;

    export const DEFAULT: DrawLayer = 0 as DrawLayer;

    export const LOWEST: DrawLayer = -1000000 as DrawLayer;
    export const UI_LAYER: DrawLayer = LOWEST as DrawLayer;

    /**
     * @param value The integer value to create a draw layer of.
     * @returns The value as a DrawLayer if it is between the allowable min and max.
     * @throws `RangeError` If `value` is outside the allowable min and max.
     */
    export function of(value: number): DrawLayer {
        if (!Number.isInteger(value) || value <= LOWEST || value >= HIGHEST) {
            throw new RangeError(`DrawLayer must be an integer between ${LOWEST} and ${HIGHEST}!`);
        }
        return value as DrawLayer;
    }
}

export type ResourcePath = string & { __brand: "ResourcePath" };
export namespace ResourcePath {
    export function of(value: string): ResourcePath {
        return value as ResourcePath;
    }
}

/**
 * A 2D vector
 */
export class Vec2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
}

export namespace Vec2 {
    /**
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns The dot product of `v1` and `v2`
     */
    export function dot(v1: Vec2, v2: Vec2): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns The cross product of `v1` and `v2`
     */
    export function cross(v1: Vec2, v2: Vec2): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    /**
     * Normalizes a vector.
     * @param v A vector to normalize.
     * @returns Vector `v` normalized.
     */
    export function normalize(v: Vec2): Vec2 {
        const mag = Math.sqrt(v.x * v.x + v.y * v.y);
        return new Vec2(v.x / mag, v.y / mag);
    }
}