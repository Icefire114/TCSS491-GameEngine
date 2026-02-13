import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RifleBullet } from "../../worldEntities/bullets/RifleBullet.js";

export class AssultRifle extends Gun {
    constructor() {
        super("AssultRifle", //tag
            120, //ammo
            30, //magSize
            10, //fireRate
            2 //reloadTime
        );
    }

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet {
        return new RifleBullet(startX, startY, targetX, targetY);
    }
}