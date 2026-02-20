import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RifleBullet } from "../../worldEntities/bullets/RifleBullet.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Vec2 } from "../../../engine/types.js";

export class AssultRifle extends Gun {

    sprite: ImagePath = new ImagePath("res/img/guns/assult_rifle/Shot.png");
    ammoBox = 60;

    animator = new Animator(
        [
            [ 
                {
                    sprite: new ImagePath("res/img/guns/assult_rifle/Shot.png"),
                    frameCount: 4,
                    frameHeight: 20,
                    frameWidth: 66,
                    offestX: 4,
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
            300, //magSize
            10, //fireRate
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

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number, playerVelocity: Vec2): Bullet {
        const localOffsetX = 1.0;  // along the gun barrel direction
        const localOffsetY = -0.2;   // perpendicular to the gun

        const originX = startX + Math.cos(this.travelAngle) * localOffsetX - Math.sin(this.travelAngle) * localOffsetY;
        const originY = startY + Math.sin(this.travelAngle) * localOffsetX + Math.cos(this.travelAngle) * localOffsetY;

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);
        return new RifleBullet(originX, originY, muzzleX, muzzleY, playerVelocity);
    }

}