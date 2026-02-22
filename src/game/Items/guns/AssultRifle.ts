import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RifleBullet } from "../../worldEntities/bullets/RifleBullet.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Player } from "../../worldEntities/player.js";

export class AssultRifle extends Gun {

    /**
     * Assult Rifle components
     */
    static TAG: string = "AssultRifle";
    static DAMAGE: number = 30;
    static FIRE_RATE: number = 5;
    static RELOAD_TIME: number = 2;
    static MAG_SIZE: number = 30;
    static SPAWN_AMMO: number = 120;

    public sprite: ImagePath = new ImagePath("res/img/guns/assult_rifle/Shot.png");
    public ammoBox = 60;
    public equipped = true;
    public unlocked = true;

    animator = new Animator(
        [
            [ 
                {
                    sprite: this.sprite,
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

    constructor() {
        super(AssultRifle.TAG, 
            AssultRifle.SPAWN_AMMO, 
            AssultRifle.MAG_SIZE, 
            AssultRifle.FIRE_RATE, 
            AssultRifle.RELOAD_TIME, 
        );

        this.syncFrames();
    }

    /**
     * Call if you want to change reload time or fire rate. 
     */
    public syncFrames(): void {
        this.animator.synchroizeFrames(AssultRifle.FIRE_RATE, AnimationState.ATTACK);
    }

    /**
     * 
     * @returns A bullet spawned at the muzzle of the gun.
     */
    protected createBullet(): Bullet {
        const localOffsetX = 1.0;  // along the gun barrel direction
        const localOffsetY = -0.2;   // perpendicular to the gun

        const originX = this.position.x + Math.cos(this.travelAngle) * localOffsetX - Math.sin(this.travelAngle) * localOffsetY;
        const originY = this.position.y + Math.sin(this.travelAngle) * localOffsetX + Math.cos(this.travelAngle) * localOffsetY;

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);
        return new RifleBullet(originX, originY, this.travelAngle);
    }

}