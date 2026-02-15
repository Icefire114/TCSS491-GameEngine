import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/types.js";
import { G_CONFIG } from "../../CONSTANTS.js";

export class SafeZoneTurretWall implements Entity, Collidable {
    tag: string = "SafeZoneTurretWall";
    id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = new BoxCollider(25, 50);
    sprite: ImagePath = new ImagePath("res/img/safe_zone/turret_wall.png");
    turretSprite: ImagePath = new ImagePath("res/img/safe_zone/turret.png")
    removeFromWorld: boolean = false;

    size: Vec2 = new Vec2(25, 50);

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = Vec2.compAdd(pos, new Vec2(this.size.x / 2, 0));
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
            this.position,
            GameEngine.g_INSTANCE.getSprite(this.sprite),
            this.size
        );
        GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
            Vec2.compAdd(this.position, new Vec2(0, -10)),
            GameEngine.g_INSTANCE.getSprite(this.turretSprite),
            new Vec2(5 * 37 / 24, 5 * 37 / 24)
        )


        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(
                Vec2.compSub(this.position, new Vec2(this.size.x / 2, 0)),
                this.size,
                "rgba(0,0,0,0)",
                "#1900ff",
                2
            );
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        // TODO: Kill all zombies that get in range of the turret
    }

}