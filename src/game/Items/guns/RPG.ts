import { Gun } from "./Gun.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { RPGRocket } from "../../worldEntities/bullets/RPGRocket.js";

export class RPG extends Gun {
    constructor() {
        super("RPG", //tag
            10, //ammo
            1, //magSize
            0.5, //fireRate
            4 //reloadTime
        );
    }

    protected createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet {
        return new RPGRocket(startX, startY, targetX, targetY);
    }
}