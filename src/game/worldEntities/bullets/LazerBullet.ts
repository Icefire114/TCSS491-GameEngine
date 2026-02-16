import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class LazerBullet extends Bullet {
    tag: string = "LazerBullet";

    physicsCollider = new BoxCollider(2, 1);
    sprite: ImagePath = new ImagePath("res/img/ammo/test_bullet.png");
    removeFromWorld: boolean = false;
    damage: number = 20;
    explosionRadius: number = 20; // world units
    speed: number = 100 // world units per second
    hitEnemies: Set<EntityID> = new Set(); // track which enemies have already been hit to prevent multiple hits

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/ammo/test_bullet.png"),
                    frameCount: 1,
                    frameHeight: 28,
                    frameWidth: 36,
                    offestX: 0
                },
                AnimationState.IDLE
            ]
        ],
        { x: 1, y: 1 }
    );


    constructor(startX: number, startY: number, endX: number, endY: number) {
        super("LazerBullet", startX, startY, endX, endY, 100, 30);

        //this.position.x += this.velocity.x * 0.04;
        //this.position.y += this.velocity.y * 0.5;
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

}
