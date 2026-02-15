import { Animator } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collider } from "../../../engine/physics/Collider.js";
import { DrawLayer } from "../../../engine/types.js";
import { Vec2 } from "../../../engine/types.js";
import { unwrap } from "../../../engine/util.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { BoxTrigger } from "../../Triggers/BoxTrigger.js";
import { ChristmasTree } from "../../worldDeco/ChristmasTree.js";
import { Player } from "../player.js";
import { SafeZoneTurretWall } from "./SafeZoneTurretWall.js";

export class SafeZone implements Entity {
    id: EntityID;
    tag: string = "SafeZone";
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;
    // List of the shops/ things we will draw in the safe zone
    animators: Animator[] = [];
    readonly size: Vec2 = new Vec2(140, 50);

    constructor(pos: Vec2, endX: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = Vec2.compAdd(pos, new Vec2(5, 0));
        this.size = new Vec2(endX - pos.x - 5, this.size.y);
        console.log(`Created SafeZone with size ${this.size}`);


        GameEngine.g_INSTANCE.addEntity(
            new BoxTrigger(
                Vec2.compAdd(this.position, new Vec2(5, 0)),
                new Vec2(1, this.size.x),
                ["player"],
                true,
                (e: Entity) => {
                    this.onPlayerEnterSafeZone(e as Player);
                }
            ), DrawLayer.DEFAULT
        );
        GameEngine.g_INSTANCE.addEntity(
            new BoxTrigger(
                Vec2.compAdd(this.position, new Vec2(this.size.x - 5, 0)),
                new Vec2(1, this.size.y),
                ["player"],
                true,
                (e: Entity) => {
                    this.onPlayerExitSafeZone(e as Player);
                }
            ), DrawLayer.DEFAULT
        );

        GameEngine.g_INSTANCE.addEntity(
            new SafeZoneTurretWall(
                Vec2.compAdd(this.position, new Vec2(5, 0))
            ), DrawLayer.WORLD_DECORATION
        );

        GameEngine.g_INSTANCE.addEntity(
            new ChristmasTree(
                Vec2.compAdd(this.position, Vec2.compDiv(new Vec2(this.size.x, this.size.y), new Vec2(2, 1)))
            ), DrawLayer.WORLD_DECORATION
        );
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(
                this.position,
                new Vec2(this.size.x, this.size.y),
                "rgba(0,0,0,0)",
                "#FF0000",
                2
            );
        }
    }



    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

    }

    private cleanupEntByTag(tag: string) {
        for (let ent of GameEngine.g_INSTANCE.getEntitiesByTag(tag)) {
            if (ent.position.x < this.position.x - GameEngine.WORLD_UNITS_IN_VIEWPORT)
                ent.removeFromWorld = true
        }
    }

    private onPlayerExitSafeZone(ent: Player) {
        console.log("Player exited the SafeZone!");
        // GameEngine.g_INSTANCE.positionScreenOnEnt(unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")), 0.15, 0.5);
    }

    private onPlayerEnterSafeZone(ent: Player) {
        console.log("Player entered the SafeZone!");
        // TODO(maybe): When we enter a safe zone we should psoition the viewport so that it can see the whole safe zone
        // GameEngine.g_INSTANCE.positionScreenOnEnt(this, 0.5, 0.75);

        // Cleanup zombies
        for (let ent of GameEngine.g_INSTANCE.getAllZombies()) {
            // Kill all the zombies that are outsize of a range around the safe zone
            if (ent.position.x < this.position.x - GameEngine.WORLD_UNITS_IN_VIEWPORT)
                ent.removeFromWorld = true
        }
        this.cleanupEntByTag("spike");
        this.cleanupEntByTag("bush");
        this.cleanupEntByTag("ChristmasTree")
        this.cleanupEntByTag("rock");
        this.cleanupEntByTag("Tree");
        this.cleanupEntByTag("ItemEntity");
        this.cleanupEntByTag("BuffEntity");
        // Old safe zone things
        this.cleanupEntByTag("SafeZone");
        this.cleanupEntByTag("SafeZoneCenterPoint");
        this.cleanupEntByTag("SafeZoneTurretWall");
    }
}
