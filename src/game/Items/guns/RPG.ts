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
                        sprite: new ImagePath("res/img/guns/assult_rifle/Shot.png"),
                        frameCount: 4,
                        frameHeight: 20,
                        frameWidth: 64,
                    },
                    AnimationState.ATTACK
                ],
                [ 
                    {
                        sprite: new ImagePath("res/img/guns/assult_rifle/Shot.png"),
                        frameCount: 1,
                        frameHeight: 128,
                        frameWidth: 128,
                    },
                    AnimationState.IDLE
                ],
                [
                    {
                        sprite: new ImagePath("res/img/guns/assult_rifle/Shot.png"),
                        frameCount: 1,
                        frameHeight: 128,
                        frameWidth: 128,
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
    }

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet {
        return new RPGRocket(startX, startY, targetX, targetY);
    }
}