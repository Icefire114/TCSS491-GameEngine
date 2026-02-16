import { Collidable } from "../../../engine/physics/Collider.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../../engine/types.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Zombie } from "../../zombies/Zombie.js";

export class Explosion implements Entity, Collidable {
    tag: string = "Explosion";
    id: EntityID;
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(15, 15);
    sprite: ImagePath = new ImagePath("res/img/ammo/RPGExplode.png");
    removeFromWorld: boolean = false;
    damage: number;
    hitEnemies: Set<EntityID> = new Set(); // track which enemies have already been hit to prevent multiple hits


    private readonly YOFFSET = 7.5; // half of collider height

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 5,
                    frameHeight: 172,
                    frameWidth: 128,
                    offestX: 0
                },
                AnimationState.IDLE
            ]
        ],
        //{ x: 15, y: 30 }
    );

    constructor(x: number, y: number, damage: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position.x = x;
        this.position.y = y + this.YOFFSET; // adjust so explosion is centered on impact point
        this.damage = damage;

        this.damageEnemy();
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, clickCoords: Vec2): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);

        // Check if animation completed (reached the end)
        const elapsed = this.animator['elapsed'];
        const secondsPerFrame = this.animator['secondsPerFrame'];
        const frameCount = this.animator['spriteSheet'][AnimationState.IDLE]?.frameCount || 1;
        const animationSpeed = this.animator['spriteSheet'][AnimationState.IDLE]?.animationSpeed || 1.0;

        const totalAnimationDuration = (frameCount * secondsPerFrame) / animationSpeed;

        if (elapsed >= totalAnimationDuration) {
            this.removeFromWorld = true;
        }
    }

    damageEnemy(): void {
        // ------------ Collision with Enemies ------------
        const zombies: Entity[] = GameEngine.g_INSTANCE.getAllZombies();
        let hitCount = 0;
        //console.log(`zombies in world: ${zombies.length}`);
        for (const zombie of zombies) {
            if (this.physicsCollider.collides(this, zombie) && zombie instanceof Zombie) {
                //console.log(`Explosion hitting zombie ${zombie.id}, health: ${zombie.health}, reward: ${zombie.reward}`);
                hitCount++;
                zombie.takeDamage(this.damage);
                console.log(zombie.reward);
                // console.log(`${this.tag} hit a zombie`);
            }
        }
        //console.log(`Explosion ${this.id} hit ${hitCount} zombies with ${this.damage} damage`);
    }
}