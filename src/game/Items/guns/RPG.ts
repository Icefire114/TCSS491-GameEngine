import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RPGRocket } from "../../worldEntities/bullets/RPGRocket.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Vec2 } from "../../../engine/types.js";

export class RPG extends Gun {

    sprite: ImagePath = new ImagePath("res/img/guns/assult_rifle/Shot.png");

    animator = new Animator(
            [
                [ 
                    {
                        sprite: new ImagePath("res/img/guns/RPG/Shot.png"),
                        frameCount: 4,
                        frameHeight: 21,
                        frameWidth: 50,
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
        super("RPG", //tag
            10, //ammo
            1, //magSize
            1, //fireRate
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
        return new RPGRocket(startX, startY, targetX, targetY);
    }
}