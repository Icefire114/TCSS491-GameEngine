import { Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { DrawLayer, Vec2 } from "../../engine/types.js";
import { BoxTrigger } from "../Triggers/BoxTrigger.js";

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
                false,
                (ent: Entity) => {
                    console.log("Player entered the SafeZone!");
                }
            ), DrawLayer.DEFAULT
        );
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(this.position, this.size, "rgba(0,0,0,0)", "#FF0000", 2);
    }



    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

    }
}
