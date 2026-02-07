import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";

export class SafeZone implements Entity {
    readonly tag: string = "SafeZone";
    readonly id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null;
    sprite: null = null;
    removeFromWorld: boolean = false;

    constructor(pos?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;

        this.position = pos ?? new Vec2(0, 0);
        this.physicsCollider = null;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {

    }


    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

    }

}