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


export class ThrowerZombie extends Zombie {
    sprite: ImagePath = new ImagePath("res/img/player_new.png");

    constructor(pos?: Vec2) {
        const tag: string = "ThrowerZombie";
        const attack_range: number = 7;
        const attack_cooldown: number = 1.5;
        const run_range: number = 15;
        const health: number = 150;
        const reward: number = 20;
        const walk_speed: number = 40;
        const run_speed: number = walk_speed * 2;
        const player_damage_amount: number = 15;

        const physicsCollider = new BoxCollider(2, 4);
        const animator: Animator = new Animator([
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
        super(tag, physicsCollider, animator, attack_range, attack_cooldown, run_range, health, reward, walk_speed, run_speed, player_damage_amount, pos);
    }

    protected _onUpdate(keys: { [key: string]: boolean; }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void {
        // No specific update logic for ThrowerZombie beyond what's in the base class right now.
        // The original code had a commented out section about stopping movement, but for now, it behaves like other attacking zombies.
    }

    protected _doAttack(player: Player, distance: number, currentTime: number): void {
        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(this.player_damage_amount);
            }
        }
    }
}