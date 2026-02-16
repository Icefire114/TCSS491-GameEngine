import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "../worldEntities/mountain.js";
import { Zombie } from "./Zombie.js";

export class BasicZombie extends Zombie {
    tag: string = "BasicZombie";
    attack_range: number = 5;
    stop_range: number = 7;
    attack_cooldown: number = 1.0; // 1 second cooldown
    lastAttackTime: number = 0; // tracks when last attacked
    run_range: number = 10; // distance at which zombie starts running
    health: number = 100; // health of the zombie
    reward: number = 10; // reward for killing this zombie

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
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
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Run.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 4
            },
            AnimationState.RUN
        ]
    ]);

    constructor(pos?: Vec2) {
        super("BasicZombie", pos);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        // checking for death
        if (this.health <= 0) {
            // death animation
            this.animator.updateAnimState(AnimationState.DEATH, deltaTime);
            return; // skip rest of update logic if dead
        }
        const currentTime = Date.now() / 1000; // current time in seconds

        const mountain: Mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        const onGround: boolean = Math.abs(this.position.y - mountain.getHeightAt(this.position.x)) <= 0.2;

        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;

        //if player dead stop moving and do idle animation
        if (player.dead) {

            this.velocity.x = 0;

            // Apply gravity to make zombie fall to ground
            this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 4;

            // Check collision with terrain to stop falling
            if (mountain && mountain.physicsCollider) {
                if (this.physicsCollider.collides(this, mountain)) {
                    this.velocity.y = 0;
                }
            }

            // Update position 
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;

            // Set animation to IDLE
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);

            return;
        }

        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); //calculate distance


        const walk_speed = 35; //zombie walk speed
        const run_speed = walk_speed * 1.2; //run speed

        if (distance > this.attack_range) {
            const MOVE_SPEED = distance > this.run_range ? run_speed : walk_speed;

            if (deltaX > 0) {
                // player it on the right of zombie
                this.velocity.x = MOVE_SPEED;
            } else {
                // player is on the left of zombie
                this.velocity.x = -MOVE_SPEED;
            }
        }

        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(10);
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

        //despawn zombie if it is behind player
        if (this.position.x < player.position.x - 20) {
            this.removeFromWorld = true;
            return;
        }
    }
}
