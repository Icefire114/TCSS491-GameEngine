import { ImagePath } from "../../../engine/assetmanager.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity } from "../../../engine/Entity.js";
import { DrawLayer } from "../../../engine/types.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Bullet } from "./Bullet.js";
import { Explosion } from "./Explosion.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class RPGRocket extends Bullet {
    tag: string = "RPGRocket";

    physicsCollider = new BoxCollider(6, 2);
    sprite: ImagePath = new ImagePath("res/img/ammo/RPGRocket.png");
    removeFromWorld: boolean = false;
    damage: number = 100;
    explosionRadius: number = 20; // world units

    speed: number = 100 // world units per second

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/ammo/RPGRocket.png"),
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


    constructor(startX: number, startY: number, endX: number, endY: number) {
        super("RPGRocket", startX, startY, endX, endY, 100, 30);

        //this.position.x += this.velocity.x * 0.04;
        //this.position.y += this.velocity.y * 0.5;
        console.log(`Bullet created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
    }

    protected onEnemyHit(target: Entity, allEnemies: Entity[]): void {
        const explosion = new Explosion(this.position.x, this.position.y, this.damage);
        GameEngine.g_INSTANCE.addEntity(explosion, DrawLayer.of(3));

        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(mountain: Entity): void {
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
