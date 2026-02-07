import { ItemEntity } from "./ItemEntity.js";
import { InfectionImmunityItem } from "./InfectionImmunity.js";
import { ShieldRestorePickupItem } from "./ShieldRestore.js";
import { InstantHealthItem } from "./InstantHealth.js";
import { AmmoRestore } from "./AmmoRestore.js";
import { Animator, AnimationState } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Vec2 } from "../../engine/types.js";
import { BuffEntity } from "./BuffEntity.js";

export class ItemFactory {
    // PS: I just copy the setup from creating entity in main.ts

    // Creating Health Item
    static createHealthPack(position: Vec2): BuffEntity {
        return new BuffEntity(
            new InstantHealthItem(),
            new Animator([
                [{
                    frameCount: 4,
                    frameHeight: 40,
                    frameWidth: 42,
                    sprite: new ImagePath("res/img/items/instant_health_pickup.png")
                }, AnimationState.IDLE]
            ], { x: 3, y: 3 }),
            new Vec2(2, 2),
            position
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
            new Vec2(2, 2), pos
        );
    }

    // Creating Gun item
    static createGun(pos: Vec2): BuffEntity {
        return new BuffEntity(
            new AmmoRestore(),
            new Animator([
                [{
                    frameCount: 7,
                    frameHeight: 24,
                    frameWidth: 43,
                    offestX: 0.1,
                    sprite: new ImagePath("res/img/items/rifle.png")
                }, AnimationState.IDLE]
            ], { x: 6, y: 3 }),
            new Vec2(6, 3), pos
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
            new Vec2(2, 2),
            position
        );
    }
}