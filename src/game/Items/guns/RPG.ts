import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RPGRocket } from "../../worldEntities/bullets/RPGRocket.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Player } from "../../worldEntities/player.js";

export class RPG extends Gun {

    /**
     * RPG components
     */
    static TAG: string = "RPG";
    static DAMAGE: number = 100;
    static FIRE_RATE: number = 2;
    static RELOAD_TIME: number = 3;
    static MAGE_SIZE: number = 1;
    static SPAWN_AMMO: number = 10;

    public sprite: ImagePath = new ImagePath("res/img/guns/RPG/Shot.png");
    public ammoBox = 10;
    public equipped = false;
    public unlocked = false;

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
    
    constructor() {
        super(RPG.TAG,
            RPG.SPAWN_AMMO,
            RPG.MAGE_SIZE,
            RPG.FIRE_RATE,
            RPG.RELOAD_TIME,
        );

        this.syncFrames();
    }

    /**
     * Call if you want to change reload time or fire rate. 
     */
    public syncFrames(): void {
        this.animator.synchroizeFrames(RPG.FIRE_RATE, AnimationState.ATTACK);
    }

     /**
     * 
     * @returns A bullet spawned at the muzzle of the gun
     */
    protected createBullet(): Bullet {
        const localOffsetX = 1.0;  // along the gun barrel direction
        const localOffsetY = -0.2;   // perpendicular to the gun

        const originX = this.position.x + Math.cos(this.travelAngle) * localOffsetX - Math.sin(this.travelAngle) * localOffsetY;
        const originY = this.position.y + Math.sin(this.travelAngle) * localOffsetX + Math.cos(this.travelAngle) * localOffsetY;

        const muzzleX = originX + Math.cos(this.travelAngle);
        const muzzleY = originY + Math.sin(this.travelAngle);
        return new RPGRocket(originX, originY, this.travelAngle);
    }
}