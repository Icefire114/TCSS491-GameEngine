import { Collidable } from "../../../engine/physics/Collider.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { AnimationState, Animator, AnimationEvent } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Zombie } from "../../zombies/Zombie.js";

export class Explosion implements Entity, Collidable {
    private readonly YOFFSET = 7.5; // half of collider height

    public tag: string = "Explosion";
    public id: EntityID;
    public position: Vec2 = new Vec2();
    public velocity: Vec2 = new Vec2();
    public physicsCollider = new BoxCollider(15, 15);
    public sprite: ImagePath = new ImagePath("res/img/ammo/RPGExplode.png");
    public removeFromWorld: boolean = false;
    public damage: number;

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 5,
                    frameHeight: 172,
                    frameWidth: 128,
                    offestX: 0,
                    fireOnFrame: 1,
                },
                AnimationState.ATTACK
            ]
        ],
    );

    constructor(x: number, y: number, damage: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position.x = x;
        this.position.y = y + this.YOFFSET; // adjust so explosion is centered on impact point
        this.damage = damage;

        this.animator.onEvent(AnimationEvent.ATTACK_END, () => {
            this.removeFromWorld = true;
        });

        this.damageEnemy();
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
    }

    damageEnemy(): void {
        // ------------ Collision with Enemies ------------
        const zombies: Entity[] = GameEngine.g_INSTANCE.getAllZombies();
        for (const zombie of zombies) {
            if (this.physicsCollider.collides(this, zombie) && zombie instanceof Zombie) {
                zombie.takeDamage(this.damage);
            }
        }
    }
}