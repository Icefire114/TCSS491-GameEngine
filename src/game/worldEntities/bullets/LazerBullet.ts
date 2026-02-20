import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";
import { Vec2 } from "../../../engine/types.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Mountain } from "../mountain.js";
import { Player } from "../player.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class LazerBullet extends Bullet {
    tag: string = "LazerBullet";

    physicsCollider = new BoxCollider(4, 2);
    sprite: ImagePath = new ImagePath("res/img/ammo/Lazer.png");
    removeFromWorld: boolean = false;
    damage: number = 20;
    explosionRadius: number = 20; // world units
    speed: number = 100 // world units per second
    hitEnemies: Set<EntityID> = new Set(); // track which enemies have already been hit to prevent multiple hits
    endPoint: Vec2;

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/ammo/Lazer.png"),
                    frameCount: 6,
                    frameHeight: 95,
                    frameWidth: 122,
                    offestX: 0
                },
                AnimationState.IDLE
            ]
        ],
        { x: 4, y: 2 }
    );


    constructor(startX: number, startY: number, endX: number, endY: number, playerVelocity: Vec2) {
        super("LazerBullet", startX, startY, endX, endY, 100, 30, playerVelocity);

        this.endPoint = this.calculateEndPoint(startX, startY, endX, endY);
        
        //this.hitScan();
    }

    calculateEndPoint(startX: number, startY: number, targetX: number, targetY: number): Vec2 {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const angle = Math.atan2(dy, dx);
        
        return new Vec2(
            startX + Math.cos(angle),
            startY + Math.sin(angle)
        );
    }

    protected onEnemyHit(target: Entity, allEnemies: Entity[]): void {
        // damage each enemy once, but allow hitting multiple enemies if they are in a line
        if (!this.hitEnemies.has(target.id) && target instanceof Zombie) {
            this.hitEnemies.add(target.id);
            target.takeDamage(this.damage);

        }
        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(mountain: Entity): void { 
        this.removeFromWorld = true;
    }

    shouldRemoveOnHit(): boolean {
        return false;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();
        
        const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);
        this.animator.drawCurrentAnimFrameAtOrigin(ctx);
        ctx.restore();
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime); 
        super.update(keys, deltaTime);
    }
}
