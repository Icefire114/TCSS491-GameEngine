import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { LazerBullet } from "../../worldEntities/bullets/LazerBullet.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Player } from "../../worldEntities/player.js";

export class RayGun extends Gun {
    readonly SHOULDER_OFFSET_X: number = -0.7;
    readonly SHOULDER_OFFSET_Y: number = -3.6;

    /**
     * Ray Gun components
     */
    static TAG: string = "RayGun";
    static DAMAGE: number = 15;
    static FIRE_RATE: number = 20;
    static RELOAD_TIME: number = 3;
    static MAG_SIZE: number = 100;
    static SPAWN_AMMO: number = 100;

    public sprite: ImagePath = new ImagePath("res/img/guns/ray_gun/Shot.png");
    public ammoBox = 100;
    public equipped = false;
    public unlocked = false;

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
    
    constructor() {
        super(RayGun.TAG,
            RayGun.SPAWN_AMMO,
            RayGun.MAG_SIZE,
            RayGun.FIRE_RATE,
            RayGun.RELOAD_TIME,
        );

        this.syncFrames();
    }

    /**
     * Call if you want to change reload time or fire rate. 
     */
    public syncFrames(): void {
        this.animator.synchroizeFrames(RayGun.FIRE_RATE, AnimationState.ATTACK);
    }

    public draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!this.equipped) return;
        ctx.save();

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;
        
        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);

        this.animator.drawCurrentAnimFrameAtOrigin(ctx, 0.5, 0.2);

        ctx.restore();
    }

     /**
     * 
     * @returns A bullet spawned at the muzzle of the gun
     */
    protected createBullet(): Bullet {
        const originX = this.position.x + Math.cos(this.travelAngle) - Math.sin(this.travelAngle);
        const originY = this.position.y + Math.sin(this.travelAngle) + Math.cos(this.travelAngle);

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);

        return new LazerBullet(originX, originY, this.travelAngle);
    }
}