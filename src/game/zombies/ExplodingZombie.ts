import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "../worldEntities/mountain.js";
import { Zombie } from "./Zombie.js";

export class ExplodingZombie extends Zombie {
    tag: string = "ExplodingZombie";
    attack_range: number = 4;
    attack_cooldown: number = 1.0; // 1 second cooldown
    lastAttackTime: number = 0; // tracks when last attacked
    run_range: number = 5; // Runs until very close
    health: number = 200;
    reward: number = 20; // reward for killing this zombie

    //Explosion properties
    explosion_radius: number = 8; // how far it reaches
    explosion_damage: number = 30; // damage dealt
    hasExploded: boolean = false; // track if already exploded

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(2, 4);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;

    // reusing Wild zombie sprites for now
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
        super("ExplodingZombie", pos);
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
        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); //calculate distance

        const walk_speed = 25; //zombie walk speed
        const run_speed = walk_speed * 1.5; //run speed

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

        //Explode when close to player
        if (distance <= this.attack_range && !this.hasExploded) {
            this.explode(player);
            this.hasExploded = true;
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

        // always running
        if (distance <= this.attack_range) {
            // attack animation (explosion)
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else {
            // Always running toward player
            if (this.velocity.x > 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime);
            } else if (this.velocity.x < 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime);
            } else {
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }
        }
    }

    //explosion logic
    explode(player: Player): void {
        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distanceToPlayer = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // deal damage if player is in explosion radius
        if (distanceToPlayer <= this.explosion_radius) {
            console.log(`ExplodingZombie exploded! Dealing ${this.explosion_damage} damage to player`);
            player.damagePlayer(this.explosion_damage);
        }

        // TODO: Add explosion visual effect here later

        // remove this zombie after explosion
        this.removeFromWorld = true;
    }
}