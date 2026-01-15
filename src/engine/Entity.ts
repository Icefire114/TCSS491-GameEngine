import { ImagePath } from "./assetmanager";
import { GameEngine } from "./gameengine";
import { Collider } from "./physics/Collider";

/**
 * This is the parent type for all entities, and they should all extend this type.
 */

export type Entity = {
    /// This is the X position of the entity in WORLD SPACE NOT RENDER SPACE
    X: number;
    /// This is the Y position of the entity in WORLD SPACE NOT RENDER SPACE
    Y: number;

    /// Current x velocity
    dX: number;
    /// Current y velocity
    dY: number;

    physicsCollider: Collider | null;
    sprite: ImagePath | null;
    readonly tag: string;

    removeFromWorld: boolean;
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void;
    update(keys: { [key: string]: boolean; }, deltaTime: number): void;
};
