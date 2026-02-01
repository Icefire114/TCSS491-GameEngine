import { AnimationState, Animator } from "../engine/Animator.js";
import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Player } from "./player.js";
import { unwrap } from "../engine/util.js";
import { Vec2 } from "../engine/types.js";

export class BasicZombie implements Entity {
    tag: string = "BasicZombie";
    id: EntityID;
    ATTACK_RANGE: number = 3; 
    ATTACK_COOLDOWN: number = 1.0; // 1 second cooldown
    lastAttackTime: number = 0; // tracks when last attacked

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    // TODO: Sprite render size should be determined by the size of the collider, or the other way around!
    physicsCollider = new BoxCollider(2, 4);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Idle.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 9,
                offestX: -3.7
            },
            AnimationState.IDLE
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Walk_L.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 10
            },
            AnimationState.WALK_L
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Walk_R.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 10
            },
            AnimationState.WALK_R
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Jump_R.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 6
            },
            AnimationState.JUMP_R
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Jump_L.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 6
            },
            AnimationState.JUMP_L
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Dead.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 5
            },
            AnimationState.DEATH
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Attack_1.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 4
            },
            AnimationState.ATTACK
        ]
    ]);

    constructor(pos?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (pos) {
            this.position = pos;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        const currentTime = Date.now() / 1000; // current time in seconds

        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); //calculate distance
        
        if (distance > this.ATTACK_RANGE) {
            // move towards player
            const MOVE_SPEED = 25; //zombie walk speed

            if (deltaX > 0) {
                // player it on the right of zombie
                this.velocity.x = MOVE_SPEED;
            } else {
                // player is on the left of zombie
                this.velocity.x = -MOVE_SPEED;
            }
       } else {
            // stop moving and attack when in rance
            this.velocity.x = 0; 
    
            // attack if cooldown is done
            if (currentTime - this.lastAttackTime >= this.ATTACK_COOLDOWN) {
                this.lastAttackTime = currentTime;
            // TODO: deal damage to player
            }
       }
   
        // make zombie move
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;


        // Update animation based on what zombie is doing
        if (distance <= this.ATTACK_RANGE) {
            // attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.velocity.x > 0) {
            // Moving right
            this.animator.updateAnimState(AnimationState.WALK_R, deltaTime);
        } else if (this.velocity.x < 0) {
            // Moving left
            this.animator.updateAnimState(AnimationState.WALK_L, deltaTime);
        } else {
            // Not moving
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        }
    }
}