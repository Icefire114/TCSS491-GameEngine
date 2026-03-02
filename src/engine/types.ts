import { Vec2 } from "./Vec2";

export type DrawLayer = number & { __brand: "DrawLayer" };
export namespace DrawLayer {
    export const HIGHEST: DrawLayer = 1000000 as DrawLayer;

    export const SKY: DrawLayer = HIGHEST - 1 as DrawLayer;
    export const BACKGROUND: DrawLayer = SKY - 1 as DrawLayer;
    export const FOREGROUND: DrawLayer = BACKGROUND - 1 as DrawLayer;
    export const WORLD_DECORATION: DrawLayer = FOREGROUND - 1 as DrawLayer;
    export const MOUNTAIN_TERRAIN: DrawLayer = WORLD_DECORATION - 1 as DrawLayer;
    export const SPIKE: DrawLayer = MOUNTAIN_TERRAIN - 1 as DrawLayer;
    export const BULLET: DrawLayer = SPIKE - 1 as DrawLayer;
    export const ZOMBIE: DrawLayer = BULLET - 1 as DrawLayer;
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
 * Marker class see {@link GameEngine.draw}
 */
export class ForceDraw {
}
