import { ImagePath } from "../../../engine/assetmanager.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { Vec2 } from "../../../engine/types.js";
import { Collidable } from "../../../engine/physics/Collider.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Mountain } from "../mountain.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Player } from "../player.js";
import { unwrap } from "../../../engine/util.js";
import { Bullet } from "./Bullet.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class RPGRocket extends Bullet {
    tag: string = "RPGRocket";

    physicsCollider = new BoxCollider(2, 1);
    sprite: ImagePath = new ImagePath("res/img/ammo/test_bullet.png");
    removeFromWorld: boolean = false;
    damage: number = 100; 
    explosionRadius: number = 20; // world units

    speed: number = 100 // world units per second

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
        super("RPGRocket", startX, startY, endX, endY, 100, 30);
        
        //this.position.x += this.velocity.x * 0.04;
        //this.position.y += this.velocity.y * 0.5;
    }

    protected onEnemyHit(target: Entity, allEnemies: Entity[]): void {
        this.explode(allEnemies);
        if (this.shouldRemoveOnHit()) {
            this.removeFromWorld = true;
        }
    }

    onTerrainHit(mountain: Entity): void {
        const zombies: Entity[] = GameEngine.g_INSTANCE.getEnemies();
        this.explode(zombies);
        this.removeFromWorld = true;
    }

    shouldRemoveOnHit(): boolean {
        return true;
     }

     explode(allEnemies: Entity[]): void {
        // damage all enemies in explosion radius 
        for (const enemy of allEnemies) {
            const dx = enemy.position.x - this.position.x;
            const dy = enemy.position.y - this.position.y;
            const distance = Math.hypot(dx, dy);

            // check if other enemies are within explosion radius and apply damage falloff based on distance
            if (distance <= this.explosionRadius) {
                if (enemy instanceof Zombie) {
                    const damage = this.damage * (1 - distance / this.explosionRadius);
                    enemy.takeDamage(damage);
                }
            }
        }

        //todo : add explosion animation and sound effect
     }
}
