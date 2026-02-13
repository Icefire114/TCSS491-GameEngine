import { Animator } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Collider } from "../../../engine/physics/Collider.js";
import { DrawLayer } from "../../../engine/types.js";
import { Vec2 } from "../../../engine/types.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { BoxTrigger } from "../../Triggers/BoxTrigger.js";
import { Player } from "../player.js";
import { SafeZoneTurretWall } from "./SafeZoneTurretWall.js";

export class SafeZone implements Entity {
    id: EntityID;
    tag: string = "SafeZone";
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;
    // List of the shops/ things we will draw in the safe zone
    animators: Animator[] = [];

    readonly size: Vec2 = new Vec2(150, 50);

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
        GameEngine.g_INSTANCE.addEntity(
            new BoxTrigger(
                Vec2.compAdd(this.position, new Vec2(5, 0)),
                new Vec2(1, this.size.y),
                ["player"],
                true,
                this.onPlayerEnterSafeZone as (e: Entity) => void
            ), DrawLayer.DEFAULT
        );

        GameEngine.g_INSTANCE.addEntity(
            new SafeZoneTurretWall(
                Vec2.compAdd(this.position, new Vec2(5, 0))
            ), DrawLayer.WORLD_DECORATION
        );
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(this.position, this.size, "rgba(0,0,0,0)", "#FF0000", 2);
        }
    }



    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

    }

    private onPlayerEnterSafeZone(ent: Player) {
        console.log("Player entered the SafeZone!");

        for (let ent of GameEngine.g_INSTANCE.getAllZombies()) {
            // Kill all the zombies that are outsize of a range around the safe zone
            if (Vec2.dist(ent.position, this.position) > GameEngine.WORLD_UNITS_IN_VIEWPORT) {
                ent.removeFromWorld = true
            }
        }
    }
}
