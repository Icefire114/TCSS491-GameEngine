import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Collider } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/types.js";
import { G_CONFIG } from "../../CONSTANTS.js";

export class SafeZoneTurretWall implements Entity {
    tag: string = "SafeZoneTurretWall";
    id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    size: Vec2 = new Vec2(25, 50);

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(this.position, this.size, "rgba(0,0,0,0)", "#1900ff", 2);
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        // TODO: Kill all zombies that get in range of the turret
    }

}