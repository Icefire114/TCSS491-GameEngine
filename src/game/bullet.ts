import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";
import { Collidable } from "../engine/physics/Collider.js";
import { AnimationState, Animator } from "../engine/Animator.js";
import { Mountain } from "./mountain.js";

/**
 * @author JK
 * @description The Bullet class.
 */
export class Bullet implements Entity, Collidable {
    tag: string = "bullet";
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(1, 1);
    sprite1: ImagePath = new ImagePath("res/img/ammo/test_bullet.png");
    removeFromWorld: boolean = false;

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
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position.x = startX;
        this.position.y = startY;

        // direction
        const dir = new Vec2(endX - startX, endY - startY);

        // normalize
        // normalize (guard against zero length)
        const length = Math.hypot(dir.x, dir.y);
        if (length <= 1e-6) {
            dir.x = 1;
            dir.y = 0;
        } else {
            dir.x /= length;
            dir.y /= length;
        }


        this.velocity.x = dir.x * this.speed;
        this.velocity.y = dir.y * this.speed;

        //this.position.x += this.velocity.x * 0.04;
        //this.position.y += this.velocity.y * 0.5;

        console.log(`Bullet created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);
    }


    update(keys: { [key: string]: boolean }, deltaTime: number): void {

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.removeFromWorld = true;
            }
        }

        // Move the bullet
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    };


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }
}
