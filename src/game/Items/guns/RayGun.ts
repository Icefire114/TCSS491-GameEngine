import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { LazerBullet } from "../../worldEntities/bullets/LazerBullet.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Vec2 } from "../../../engine/types.js";
import { GameEngine } from "../../../engine/gameengine.js";

export class RayGun extends Gun {
    readonly SHOULDER_OFFSET_X: number = -0.7;
    readonly SHOULDER_OFFSET_Y: number = -3.6;
    readonly GUN_LENGTH: number = 1;

    sprite: ImagePath = new ImagePath("res/img/guns/ray_gun/Shot.png");
    ammoBox = 100;
    static tag: string = "RayGun";
    static damage: number = 15;
    static fireRate: number = 20;
    static reloadTime: number = 3;
    static magSize: number = 100;
    static ammo: number = 100;
    static speed: number = 100;
    equipped = false;
    unlocked = false;

    animator = new Animator(
            [
                [ 
                    {
                        sprite: new ImagePath("res/img/guns/ray_gun/Shot.png"),
                        frameCount: 1,
                        frameHeight: 26,
                        frameWidth: 41,
                        fireOnFrame: 1
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
        super(RayGun.tag, //tag
            RayGun.ammo, //ammo
            RayGun.magSize, //magSize
            RayGun.fireRate, //fireRate
            RayGun.reloadTime, //reloadTime
            position
        );

        this.synchroizeAttackFrames();
        
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
            ctx.save();
    
            const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
            const screenY = (this.position.y - game.viewportY) * scale / game.zoom;
            
            ctx.translate(screenX, screenY);
            ctx.rotate(this.travelAngle);
    
            this.animator.drawCurrentAnimFrameAtOrigin(ctx, 0.5, 0.2);
    
            ctx.restore();
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
        const originX = startX + Math.cos(this.travelAngle) - Math.sin(this.travelAngle);
        const originY = startY + Math.sin(this.travelAngle) + Math.cos(this.travelAngle);

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);

        return new LazerBullet(originX, originY, muzzleX, muzzleY, playerVelocity);
    }
}