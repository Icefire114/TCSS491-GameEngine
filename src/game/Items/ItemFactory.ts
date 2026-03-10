import { InfectionImmunityItem } from "./InfectionImmunity.js";
import { ShieldRestorePickupItem } from "./ShieldBoost.js";
import { InstantHealthPickupBuff } from "./InstantHealthPickupBuff.js";
import { AmmoRestore } from "./AmmoRestore.js";
import { Animator, AnimationState } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Vec2 } from "../../engine/Vec2.js";
import { BuffEntity } from "./BuffEntity.js";
import { ShockwaveBombItem } from "./ShockwaveBombItem.js";
import { JumpBoostItem } from "./JumpBoostItem.js";

export class ItemFactory {
    // PS: I just copy the setup from creating entity in main.ts

    // Creating Health Item
    static createHealthPack(pos: Vec2): BuffEntity {
        return new BuffEntity(
            new InstantHealthPickupBuff(),
            new Animator(
                [
                    [
                        {
                            frameCount: 4,
                            frameHeight: 40,
                            frameWidth: 42,
                            sprite: new ImagePath("res/img/items/instant_health_pickup.png")
                        },
                        AnimationState.IDLE
                    ]
                ],
                { x: 3, y: 3 }
            ),
            new Vec2(3, 3),
            pos
        );
    }

    // Creating Shield
    static createShieldRestore(pos: Vec2): BuffEntity {
        return new BuffEntity(
            new ShieldRestorePickupItem(),
            new Animator([
                [{
                    frameCount: 10,
                    frameHeight: 64,
                    frameWidth: 54,
                    sprite: new ImagePath("res/img/items/shield_pickup.png")
                }, AnimationState.IDLE]
            ], { x: 3, y: 3 }),
            new Vec2(3, 3),
            pos
        );
    }

    // Creating Gun item
    static createGun(pos: Vec2): BuffEntity {
        return new BuffEntity(
            new AmmoRestore(),
            new Animator([
                [{
                    frameCount: 8,
                    frameHeight: 22,
                    frameWidth: 30,
                    sprite: new ImagePath("res/img/items/AmmoBox.png")
                }, AnimationState.IDLE]
            ], { x: 6, y: 4 }),
            new Vec2(6, 4), pos
        );
    }

    // Creating Immunity
    static createImmunity(position: Vec2): BuffEntity {
        return new BuffEntity(
            new InfectionImmunityItem(),
            new Animator([
                [{
                    frameCount: 15,
                    frameHeight: 51,
                    frameWidth: 39,
                    sprite: new ImagePath("res/img/items/infection_immunity.png")
                },
                AnimationState.IDLE]
            ], { x: 3, y: 3 }),
            new Vec2(3, 3),
            position
        );
    }

    // Creating Shock wave bomb
    static creatShockWaveBomb(position: Vec2): BuffEntity {
        return new BuffEntity(
            new ShockwaveBombItem(),
            new Animator([
                [{
                    frameCount: 1,
                    frameHeight: 12,
                    frameWidth: 12,
                    sprite: new ImagePath("res/img/items/bomb.png")
                },
                AnimationState.IDLE]
            ], { x: 4, y: 4 }),
            new Vec2(4, 4),
            position
        );
    }

    // Creating the jump boost
    static createJumpBoost(position: Vec2): BuffEntity {
        return new BuffEntity(
            new JumpBoostItem(),
            new Animator([
                [{
                    frameCount: 1,
                    frameHeight: 17,
                    frameWidth: 17,
                    sprite: new ImagePath("res/img/items/boots.png")
                },
                AnimationState.IDLE]
            ], { x: 3, y: 3 }),
            new Vec2(3, 3),
            position
        );
    }   
}