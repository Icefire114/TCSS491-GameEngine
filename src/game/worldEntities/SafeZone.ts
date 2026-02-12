import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";

export class SafeZone implements Entity {
    id: EntityID;
    tag: string = "SafeZone";
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;

    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // const canvasPos: Vec2 = GameEngine.g_INSTANCE.renderer.convertWorldPosToScreenPos(this.position, new Vec2(150, 100));
        GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(this.position, new Vec2(150, 50), "rgba(0,0,0,0)", "#FF0000", 2);
    }



    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

    }
}