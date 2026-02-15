import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RifleBullet } from "../../worldEntities/bullets/RifleBullet.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Vec2 } from "../../../engine/types.js";

export class AssultRifle extends Gun {

    private static muzzleXOffset: number = 2; // distance from player center to muzzle in the direction of shooting
    private static muzzleYOffset: number = 4; // vertical offset from player center to muzzle

    sprite: ImagePath = new ImagePath("res/img/guns/assult_rifle/Shot.png");

    animator = new Animator(
        [
            [ 
                {
                    sprite: new ImagePath("res/img/guns/assult_rifle/Shot.png"),
                    frameCount: 4,
                    frameHeight: 20,
                    frameWidth: 64,
                    fireOnFrame: 2
                },
                AnimationState.ATTACK
            ],
            [ 
                {
                    sprite: new ImagePath("res/img/guns/IdleGun.png"),
                    frameCount: 1,
                    frameHeight: 1,
                    frameWidth: 1,
                },
                AnimationState.IDLE
            ],
            [
                {
                    sprite: new ImagePath("res/img/guns/IdleGun.png"),
                    frameCount: 1,
                    frameHeight: 1,
                    frameWidth: 1,
                },
                AnimationState.RELOAD
            ]
        ]
    );

    constructor(position: Vec2) {
        super("AssultRifle", //tag
            120, //ammo
            30, //magSize
            5, //fireRate
            2, //reloadTime
            position
        );

        this.synchroizeAttackFrames();
    }

    synchroizeAttackFrames(): void {
        // Get the attack animation info
        const attackAnimInfo = this.animator['spriteSheet'][AnimationState.ATTACK];
        if (!attackAnimInfo) return;
        
        // Calculate desired animation duration based on fire rate
        const shotCooldownSeconds = this.getShotCooldown() / 1000; // convert ms to seconds
        
        // Calculate how long the animation naturally takes at base speed
        const baseAnimDuration = attackAnimInfo.frameCount / this.animator['ANIMATION_FPS'];
        
        // Calculate speed multiplier needed
        const speedMultiplier = baseAnimDuration / shotCooldownSeconds;
        
        // Update the animation speed
        attackAnimInfo.animationSpeed = speedMultiplier;
    }

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet {
        return new RifleBullet(
            startX + AssultRifle.muzzleXOffset, 
            startY - AssultRifle.muzzleYOffset, 
            targetX, 
            targetY);
    }
}