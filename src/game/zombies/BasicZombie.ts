import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Player } from "../worldEntities/player.js";
import { unwrap } from "../../engine/util.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Mountain } from "../worldEntities/mountain.js";
import { Zombie } from "./Zombie.js";

export class BasicZombie extends Zombie {
    sprite: ImagePath = new ImagePath("res/img/player_new.png");

    constructor(pos?: Vec2) {
        const tag: string = "BasicZombie";
        const attack_range: number = 5;
        const attack_cooldown: number = 1.0;
        const run_range: number = 10;
        const health: number = 100;
        const reward: number = 10;
        const walk_speed: number = 35;
        const run_speed: number = walk_speed * 1.2;
        const player_damage_amount: number = 10;

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
        // No specific update logic for BasicZombie beyond what's in the base class.
        // It can optionally override parts of the base update if needed.
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
