import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RPGRocket } from "../../worldEntities/bullets/RPGRocket.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Vec2 } from "../../../engine/types.js";

export class RPG extends Gun {

    sprite: ImagePath = new ImagePath("res/img/guns/RPG/Shot.png");
    ammoBox = 10;
    static tag: string = "RPG";
    static damage: number = 30;
    static fireRate: number = 2;
    static reloadTime: number = 3;
    static magSize: number = 1;
    static ammo: number = 10;
    static speed: number = 100;
    equipped = false;
    unlocked = false;

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
        super(RPG.tag, //tag
            RPG.ammo, //ammo
            RPG.magSize, //magSize
            RPG.fireRate, //fireRate
            RPG.reloadTime, //reloadTime
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

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number,  playerVelocity: Vec2): Bullet {
        const localOffsetX = 1.0;  // along the gun barrel direction
        const localOffsetY = -0.2;   // perpendicular to the gun

        const originX = startX + Math.cos(this.travelAngle) * localOffsetX - Math.sin(this.travelAngle) * localOffsetY;
        const originY = startY + Math.sin(this.travelAngle) * localOffsetX + Math.cos(this.travelAngle) * localOffsetY;

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);
        return new RPGRocket(originX, originY, muzzleX, muzzleY, playerVelocity);
    }
}