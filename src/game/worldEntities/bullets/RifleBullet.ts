import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class RifleBullet extends Bullet {
    tag: string = "RifleBullet";

    physicsCollider = new BoxCollider(1, 0.5);
    sprite: ImagePath = new ImagePath("res/img/ammo/RifleBullet.png");
    removeFromWorld: boolean = false;
    damage: number = 30;

    speed: number = 100 // world units per second

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/ammo/RifleBullet.png"),
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


    constructor(startX: number, startY: number, endX: number, endY: number) {
        super("RifleBullet", startX, startY, endX, endY, 100, 30);

        //this.position.x += this.velocity.x * 0.04;
        //this.position.y += this.velocity.y * 0.5;

        console.log(`Bullet created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
    }

    onEnemyHit(target: Entity, allEnemies: Entity[]): void {
        if (target instanceof Zombie) {
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
        return true;
    }
}
