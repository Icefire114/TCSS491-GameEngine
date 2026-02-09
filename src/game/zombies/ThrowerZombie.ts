import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "../worldEntities/mountain.js";


export class ThrowerZombie implements Entity {
    tag: string = "ThrowerZombie";
    id: EntityID;
    attack_range: number = 7;
    attack_cooldown: number = 1.5; // 1 second cooldown
    lastAttackTime: number = 0; // tracks when last attacked
    run_range: number = 15; // distance at which zombie starts running

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(2, 4);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Idle.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 5,
            },
            AnimationState.IDLE
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Walk_L.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 7
            },
            AnimationState.WALK_L
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Walk_R.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 7
            },
            AnimationState.WALK_R
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Jump_R.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 6
            },
            AnimationState.JUMP_R
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Jump_L.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 6
            },
            AnimationState.JUMP_L
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Dead.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 5
            },
            AnimationState.DEATH
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Attack.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 4
            },
            AnimationState.ATTACK
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Thrower Zombie/Run.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 4
            },
            AnimationState.RUN
        ]
    ]);

    constructor(pos?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (pos) {
            this.position = pos;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // TODO: if moving rotate sprite to be perpidicular to the normal of the mountain slope
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        const currentTime = Date.now() / 1000; // current time in seconds

        const mountain: Mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        const onGround: boolean = Math.abs(this.position.y - mountain.getHeightAt(this.position.x)) <= 0.2;

        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); //calculate distance


        const walk_speed = 40; //zombie walk speed
        const run_speed = walk_speed * 2;

        if (distance > this.attack_range) {
            const MOVE_SPEED = distance > this.run_range ? run_speed : walk_speed;

            if (deltaX > 0) {
                // player it on the right of zombie
                this.velocity.x = MOVE_SPEED;
            } else {
                // player is on the left of zombie
                this.velocity.x = -MOVE_SPEED;
            }
            //commented this for now so that the zombie attacks while moving and doesn't go idle
            // } else {
            //     // stop moving and attack when in rance
            //     this.velocity.x = 0;
        }

        // attack if cooldown is done
        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(15);
            }
        }

        // ---------- Gravity ----------
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 4;

        // ---------- Collision with terrain ----------
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.velocity.y = 0;
            }
        }


        // ---------- Integrate ----------
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        // Update animation based on what zombie is doing
        if (distance <= this.attack_range) {
            // attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (distance > this.run_range) {
            // Running (far from player)
            if (this.velocity.x > 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime);
            } else if (this.velocity.x < 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime); //TODO make run left animation
            } else {
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }
        } else {
            // Walking (medium distance)
            if (this.velocity.x > 0) {
                this.animator.updateAnimState(AnimationState.WALK_R, deltaTime);
            } else if (this.velocity.x < 0) {
                this.animator.updateAnimState(AnimationState.WALK_L, deltaTime);
            } else {
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }
        }
    }
}