import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../../engine/physics/Collider.js";
import { DrawLayer } from "../../../engine/types.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { unwrap } from "../../../engine/util.js";
import { ShaderRegistry } from "../../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../../engine/WebGL/WebGL.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { BoxTrigger } from "../../Triggers/BoxTrigger.js";
import { UILayer } from "../../UI.js";
import { Zombie } from "../../zombies/Zombie.js";
import { RifleBullet } from "../bullets/RifleBullet.js";
import { SafeZone } from "./SafeZone.js";

export type SafeZoneWallType = "enter" | "exit";

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
    private hasPlayerInteracted: boolean = false;
    private wallInteractTrigger: BoxTrigger;
    private parentSafeZone: SafeZone;
    type: SafeZoneWallType;

    constructor(pos: Vec2, parentSafeZone: SafeZone, type: SafeZoneWallType) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = Vec2.compAdd(pos, new Vec2(this.size.x / 2, 0));

        this.wallInteractTrigger = GameEngine.g_INSTANCE.addEntity(
            new BoxTrigger(
                Vec2.compSub(this.position, new Vec2(this.size.x / 2 + 2.5, 0)),
                new Vec2(5, this.size.y),
                ["player"],
                false,
                (e: Entity) => { }
            ), DrawLayer.DEFAULT
        ) as BoxTrigger;

        this.parentSafeZone = parentSafeZone;
        this.type = type;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 1,
            offsetX: 0
        };
        const shader = unwrap(ShaderRegistry.getShader(WebGL.SNOW_AND_AREA_LIGHT, currentAnim.sprite), "Did not find shader for given template");

        shader.render([
            // Snow shader uniforms
            {
                u_snowHeight: 0.2,
                u_snowThickness: 0.8
            },
            {
                u_lightCount: 2n,
                u_lightSize: [[60], [60]],
                u_lightPos: [[185, 187], [231, 187]],
                u_lightColor: [[0.83137254901961, 0.0156862745098, 0.0156862745098, 1.0], [0.83137254901961, 0.0156862745098, 0.0156862745098, 1.0]], // rgba
                u_ambient: 0.95 //TODO: Change depending on time of day
            }
        ]);

        game.renderer.drawRawCanvasAtWorldPos(
            this.position,
            shader.canvas,
            this.size
        );

        if (this.type == "enter") {
            GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
                Vec2.compAdd(this.position, new Vec2(0, -50)),
                GameEngine.g_INSTANCE.getSprite(this.turretSprite),
                new Vec2(0.35 * 37, 0.35 * 24)
            );
        }

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
        if (this.type === "enter") {
            ui.drawEnterSZPrompt = this.wallInteractTrigger.contains(unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")));
            if (ui.drawEnterSZPrompt && keys['e'] && !this.hasPlayerInteracted) {
                this.hasPlayerInteracted = true;
                unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")).position = Vec2.compAdd(this.position, new Vec2(15, 0));
                this.parentSafeZone.onPlayerEnterSafeZone();
            }


            if (this.hasPlayerInteracted && this.lastShot <= performance.now() - this.shootCoolDownMS) {
                this.lastShot = performance.now();
                const turretTip = Vec2.compAdd(this.position, new Vec2(-2.5, -50));

                // Get all zombies that are before the safe zone
                const targets: Zombie[] = GameEngine.g_INSTANCE.getAllZombies()
                    .filter(e => {
                        return e.position.x < turretTip.x + 10 && e.health > 0;
                    });

                for (const z of targets) {
                    const dx = z.position.x - turretTip.x;
                    const dy = z.position.y - turretTip.y;
                    const angle = Math.atan2(dy, dx);
                    GameEngine.g_INSTANCE.addEntity(new RifleBullet(turretTip.x, turretTip.y, angle), DrawLayer.BULLET);
                }
            }
        } else {
            ui.drawExitSZPrompt = this.wallInteractTrigger.contains(unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")));
            if (ui.drawExitSZPrompt && keys['e'] && !this.hasPlayerInteracted) {
                this.hasPlayerInteracted = true;
                unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")).position = Vec2.compAdd(this.position, new Vec2(15, 0));
                this.parentSafeZone.onPlayerExitSafeZone();
            }
        }
    }
}