import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { LazerBullet } from "../../worldEntities/bullets/LazerBullet.js";

export class RayGun extends Gun {
    constructor() {
        super("RayGun", //tag
            100, //ammo
            30, //magSize
            20, //fireRate
            3 //reloadTime
        );
    }

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet {
        return new LazerBullet(startX, startY, targetX, targetY);
    }
}