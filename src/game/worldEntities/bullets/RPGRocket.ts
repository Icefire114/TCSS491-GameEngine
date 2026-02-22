import { ImagePath } from "../../../engine/assetmanager.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity } from "../../../engine/Entity.js";
import { DrawLayer } from "../../../engine/types.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Bullet } from "./Bullet.js";
import { Explosion } from "./Explosion.js";
import { RPG } from "../../Items/guns/RPG.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class RPGRocket extends Bullet {

    public tag: string = "RPGRocket";
    public physicsCollider = new BoxCollider(6, 2);
    public sprite: ImagePath = new ImagePath("res/img/ammo/RPGRocket.png");
    public removeFromWorld: boolean = false;
    public damage: number = RPG.DAMAGE;

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 1,
                    frameHeight: 8,
                    frameWidth: 42,
                    offestX: 0
                },
                AnimationState.IDLE
            ],
        ],
        { x: 6, y: 1 }
    );

    constructor(startX: number, startY: number, angle: number) {
        super("RPGRocket", startX, startY, angle);
        //console.log(`Bullet created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
    }

    protected onEnemyHit(target: Entity): void {
        const explosion = new Explosion(this.position.x, this.position.y, this.damage);
        GameEngine.g_INSTANCE.addEntity(explosion, DrawLayer.of(3));

        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(): void {
        const explosion = new Explosion(this.position.x, this.position.y, this.damage);
        GameEngine.g_INSTANCE.addEntity(explosion, DrawLayer.of(3));

        this.removeFromWorld = true;
        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    shouldRemoveOnHit(): boolean {
        return true;
    }
}
