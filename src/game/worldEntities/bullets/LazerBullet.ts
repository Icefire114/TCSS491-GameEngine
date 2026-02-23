import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { RayGun } from "../../Items/guns/RayGun.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class LazerBullet extends Bullet {
    public tag: string = "LazerBullet";
    public physicsCollider = new BoxCollider(4, 2);
    public sprite: ImagePath = new ImagePath("res/img/ammo/Lazer.png");
    public removeFromWorld: boolean = false;
    public damage: number = RayGun.DAMAGE;

    private hitEnemies: Set<EntityID> = new Set(); // track which enemies have already been hit to prevent multiple hits

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
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

    constructor(startX: number, startY: number, angle: number) {
        super("LazerBullet", startX, startY, angle);
    }

    protected onEnemyHit(target: Entity): void {
        // damage each enemy once, but allow hitting multiple enemies if they are in a line
        if (!this.hitEnemies.has(target.id) && target instanceof Zombie) {
            this.hitEnemies.add(target.id);
            target.takeDamage(this.damage);

        }
        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(): void { 
        this.removeFromWorld = true;
    }

    shouldRemoveOnHit(): boolean {
        return false;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();
        
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
