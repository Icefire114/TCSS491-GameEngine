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
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    explosion_radius: number = 8; // how far it reaches
    explosion_damage: number = 30; // damage dealt
    hasExploded: boolean = false; // track if already exploded

    constructor(pos?: Vec2) {
        const tag: string = "ExplodingZombie";
        const attack_range: number = 4;
        const attack_cooldown: number = 1.0;
        const run_range: number = 5;
        const health: number = 200;
        const reward: number = 20;
        const walk_speed: number = 25;
        const run_speed: number = walk_speed * 1.5;
        const player_damage_amount: number = 0; // Damage is handled by explode

        const physicsCollider = new BoxCollider(2, 4);
        const animator: Animator = new Animator([
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
        super(tag, physicsCollider, animator, attack_range, attack_cooldown, run_range, health, reward, walk_speed, run_speed, player_damage_amount, pos);
    }

    protected _onUpdate(keys: { [key: string]: boolean; }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void {
        //Explode when close to player
        if (distance <= this.attack_range && !this.hasExploded) {
            this.explode(player);
            this.hasExploded = true;
        }

        // Always running
        if (distance > this.attack_range) {
            if (this.velocity.x > 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime);
            } else if (this.velocity.x < 0) {
                this.animator.updateAnimState(AnimationState.RUN, deltaTime);
            } else {
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }
        }
    }

    protected _doAttack(player: Player, distance: number, currentTime: number): void {
        // Attack logic is handled in _onUpdate via the explode method
    }

    explode(player: Player): void {
        const deltaX = player.position.x - this.position.x;
        const deltaY = player.position.y - this.position.y;
        const distanceToPlayer = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // deal damage if player is in explosion radius
        if (distanceToPlayer <= this.explosion_radius) {
            console.log(`ExplodingZombie exploded! Dealing ${this.explosion_damage} damage to player`);
            player.damagePlayer(this.explosion_damage, "Infection");
        }

        // TODO: Add explosion visual effect here later

        // remove this zombie after explosion
        this.removeFromWorld = true;
    }
}