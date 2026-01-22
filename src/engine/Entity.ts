import { ImagePath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";
import { Collider } from "./physics/Collider.js";
import { Vec2 } from "./types.js";

/**
 * Should be just `{entityTAG}#{UUID}`.
 */
export type EntityID = `${string}#${string}-${string}-${string}-${string}-${string}`;

/**
 * This is the parent type for all entities, and they should all extend this type.
 */
export type Entity = {
    readonly id: EntityID;
    readonly tag: string;

    position: Vec2;
    velocity: Vec2;

    physicsCollider: Collider | null;

    /**
     * The fallback sprite for the entity if it's not animatable.
     */
    sprite: ImagePath | null;

    removeFromWorld: boolean;
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void;
    update(keys: { [key: string]: boolean; }, deltaTime: number): void;
};
