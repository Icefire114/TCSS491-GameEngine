import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../../engine/physics/Collider.js";
import { DrawLayer, Vec2 } from "../../../engine/types.js";
import { unwrap } from "../../../engine/util.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { BoxTrigger } from "../../Triggers/BoxTrigger.js";
import { UILayer } from "../../UI.js";
import { Zombie } from "../../zombies/Zombie.js";
import { RifleBullet } from "../bullets/RifleBullet.js";
import { SafeZone } from "./SafeZone.js";

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
    private lastShot: number = 0;
    private readonly shootCoolDownMS: number = 75;
    private hasPlayerEntered: boolean = false;
    private enterSafeZoneTrigger: BoxTrigger;
    private parentSafeZone: SafeZone;

    constructor(pos: Vec2, parentSafeZone: SafeZone) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = Vec2.compAdd(pos, new Vec2(this.size.x / 2, 0));
        this.enterSafeZoneTrigger = GameEngine.g_INSTANCE.addEntity(
            new BoxTrigger(
                Vec2.compSub(this.position, new Vec2(this.size.x / 2 + 2.5, 0)),
                new Vec2(5, this.size.y),
                ["player"],
                false,
                (e: Entity) => { }
            ), DrawLayer.DEFAULT
        ) as BoxTrigger;
        this.parentSafeZone = parentSafeZone;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
            this.position,
            GameEngine.g_INSTANCE.getSprite(this.sprite),
            this.size
        );
        GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
            Vec2.compAdd(this.position, new Vec2(0, -50)),
            GameEngine.g_INSTANCE.getSprite(this.turretSprite),
            new Vec2(0.35 * 37, 0.35 * 24)
        );

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
        const ui: UILayer = GameEngine.g_INSTANCE.getUniqueEntityByTag("UI_LAYER") as UILayer;
        ui.drawEnterSZPrompt = this.enterSafeZoneTrigger.contains(unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")));
        if (ui.drawEnterSZPrompt && keys['e'] && !this.hasPlayerEntered) {
            this.hasPlayerEntered = true;
            unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")).position = Vec2.compAdd(this.position, new Vec2(15, 0));
            this.parentSafeZone.onPlayerEnterSafeZone();
        }


        if (this.hasPlayerEntered && this.lastShot <= performance.now() - this.shootCoolDownMS) {
            this.lastShot = performance.now();
            const turretTip = Vec2.compAdd(this.position, new Vec2(2.5, -50));

            // Get all zombies that are before the safe zone
            const targets: Zombie[] = GameEngine.g_INSTANCE.getAllZombies()
                .filter(e => {
                    return e.position.x < turretTip.x + 10 && e.health > 0;
                });

            for (const z of targets) {
                GameEngine.g_INSTANCE.addEntity(new RifleBullet(turretTip.x, turretTip.y, z.position.x, z.position.y, new Vec2()), DrawLayer.BULLET);
            }
        }
    }

}