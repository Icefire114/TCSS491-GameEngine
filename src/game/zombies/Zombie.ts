import { Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../engine/types.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { AnimationState } from "../../engine/Animator.js";
import { Mountain } from "../worldEntities/mountain.js";

export abstract class Zombie implements Entity {
    tag: string;
    id: EntityID;

    protected attack_range: number;
    protected attack_cooldown: number;
    lastAttackTime: number = 0;
    protected run_range: number;
    health: number;
    reward: number; // currency reward for killing this zombie
    rewardGiven: boolean = false; // track if reward has been given to player

    protected walk_speed: number;
    protected run_speed: number;
    protected player_damage_amount: number;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider: BoxCollider;
    abstract sprite: ImagePath;
    removeFromWorld: boolean = false;

    animator: Animator;

    constructor(tag: string, physicsCollider: BoxCollider, animator: Animator, attack_range: number, attack_cooldown: number, run_range: number, health: number, reward: number, walk_speed: number, run_speed: number, player_damage_amount: number, pos?: Vec2) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.physicsCollider = physicsCollider;
        this.animator = animator;
        this.attack_range = attack_range;
        this.attack_cooldown = attack_cooldown;
        this.run_range = run_range;
        this.health = health;
        this.reward = reward;
        this.walk_speed = walk_speed;
        this.run_speed = run_speed;
        this.player_damage_amount = player_damage_amount;

        if (pos) {
            this.position = pos;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // TODO: if moving rotate sprite to be perpidicular to the normal of the mountain slope
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }



    takeDamage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0 && !this.rewardGiven) {
            this.rewardGiven = true;
            const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;
            player.killedEnemy(this);
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        if (this.health <= 0) {
            this.animator.updateAnimState(AnimationState.DEATH, deltaTime);
            return;
        }

        const currentTime = Date.now() / 1000;
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;
        const mountain: Mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;

        // If player is dead, just fall and idle
        if (player.dead) {
            this.velocity.x = 0;
            this.applyGravityAndCollision(deltaTime, mountain);
            this.updatePosition(deltaTime);
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            return;
        }

        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        this.moveTowardsPlayer(player, distance, deltaX);
        this._doAttack(player, distance, currentTime);
        this.applyGravityAndCollision(deltaTime, mountain);
        this.updatePosition(deltaTime);
        this.updateZombieAnimation(distance, deltaTime);
        this.checkDespawn(player);

        this._onUpdate(keys, deltaTime, player, mountain, distance, currentTime);
    }

    protected abstract _onUpdate(keys: { [key: string]: boolean; }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void;
    protected abstract _doAttack(player: Player, distance: number, currentTime: number): void;

    protected applyGravityAndCollision(deltaTime: number, mountain: Mountain): void {
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 4;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.velocity.y = 0;
            }
        }

        const walls = GameEngine.g_INSTANCE.getEntitiesByTag("SafeZoneTurretWall");
        for (const wall of walls) {
            if (this.physicsCollider.collides(this, wall)) {
                this.velocity.x = this.velocity.x * -1;
                this.position.x += this.velocity.x * 0.009;
            }
        }
    }

    protected updatePosition(deltaTime: number): void {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    protected moveTowardsPlayer(player: Player, distance: number, deltaX: number): void {
        if (distance > this.attack_range) {
            const MOVE_SPEED = distance > this.run_range ? this.run_speed : this.walk_speed;
            this.velocity.x = deltaX > 0 ? MOVE_SPEED : -MOVE_SPEED;
        } else {
            this.velocity.x = 0; // Stop moving when in attack range by default
        }
    }

    protected updateZombieAnimation(distance: number, deltaTime: number): void {
        if (distance <= this.attack_range) {
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (distance > this.run_range) {
            this.animator.updateAnimState(AnimationState.RUN, deltaTime);
        } else {
            if (this.velocity.x > 0) {
                this.animator.updateAnimState(AnimationState.WALK_R, deltaTime);
            } else if (this.velocity.x < 0) {
                this.animator.updateAnimState(AnimationState.WALK_L, deltaTime);
            } else {
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }
        }
    }

    protected checkDespawn(player: Player): void {
        if (this.position.x < player.position.x - GameEngine.WORLD_UNITS_IN_VIEWPORT * 3) {
            this.removeFromWorld = true;
        }
    }
}