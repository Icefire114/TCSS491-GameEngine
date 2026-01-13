import { GameEngine } from "./gameengine.js";

/**
 * This is the parent type for all entities, and they should all extend this type.
 */
export type Entity = {
    X: number;
    Y: number;

    removeFromWorld: boolean;
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void;
    update(): void;
};