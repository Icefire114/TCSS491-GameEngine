import { ImagePath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";

/**
 * This is the parent type for all entities, and they should all extend this type.
 */
export type Entity = {
    X: number;
    Y: number;
    sprite: ImagePath | null;

    removeFromWorld: boolean;
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void;
    update(keys: { [key: string]: boolean }, deltaTime: number): void;
};

export type DrawLayer = number & { __brand: "DrawLayer" };
export namespace DrawLayer {
    export const LOWEST = -1000000 as DrawLayer;
    export const DEFAULT = 0 as DrawLayer;
    export const HIGHEST = 1000000 as DrawLayer;

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