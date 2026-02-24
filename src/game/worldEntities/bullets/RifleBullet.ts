import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";
import { AssultRifle } from "../../Items/guns/AssultRifle.js";
import { Boss } from "../../worldEntities/Boss.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class RifleBullet extends Bullet {

    public tag: string = "RifleBullet";
    public damage: number = AssultRifle.DAMAGE;
    public physicsCollider = new BoxCollider(1, 0.5);
    public sprite: ImagePath = new ImagePath("res/img/ammo/RifleBullet.png");
    public removeFromWorld: boolean = false;

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 1,
                    frameHeight: 28,
                    frameWidth: 36,
                    offestX: 0
                },
                AnimationState.IDLE
            ]
        ],
        { x: 1, y: 0.5 }
    );

    constructor(startX: number, startY: number, angle: number) {
        super("RifleBullet", startX, startY, angle);
        //console.log(`Bullet created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
    }

    onEnemyHit(target: Entity): void {
        if (target instanceof Zombie) {
            target.takeDamage(this.damage);
        }
        if (target instanceof Boss) {
            target.damage(this.damage);
        }
        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(): void {
        this.removeFromWorld = true;
    }

    shouldRemoveOnHit(): boolean {
        return true;
    }
}
