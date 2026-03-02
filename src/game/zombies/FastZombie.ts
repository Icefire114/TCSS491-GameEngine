import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Mountain } from "../worldEntities/mountain.js";
import { Zombie } from "./Zombie.js";

export class FastZombie extends Zombie {
    sprite: ImagePath = new ImagePath("res/img/player_new.png");

    constructor(pos?: Vec2) {
        const tag: string = "FastZombie";
        const attack_range: number = 3;
        const attack_cooldown: number = 0.5;
        const run_range: number = 5;
        const health: number = 60;
        const reward: number = 15;
        const walk_speed: number = 30;
        const run_speed: number = walk_speed * 1.7;
        const player_damage_amount: number = 5;

        const physicsCollider = new BoxCollider(2, 4.5);
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
        ], new Vec2(7, 9));
        super(tag, physicsCollider, animator, attack_range, attack_cooldown, run_range, health, reward, walk_speed, run_speed, player_damage_amount, pos);
    }

    protected _onUpdate(keys: { [key: string]: boolean; }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void {
        // Fast Zombie specific animation logic - always running when not attacking
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
        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(this.player_damage_amount, "Infection");
            }
        }
    }
}