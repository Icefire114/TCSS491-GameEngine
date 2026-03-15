import { Buff, BuffType, TempBuff } from "./Buff.js";
import { ImagePath } from "../../engine/assetmanager.js";

export class CrownItem implements Buff, TempBuff {
    type: BuffType = BuffType.TEMP_BUFF;
    tag: string = "crown_boost";
    sprite: ImagePath = new ImagePath("res/img/items/king.png");

    startingDuration: number = 10;
    currentDuration: number = 10;

    onApply(): void {
        // NO setup as money of zombies is handle in palyer killedEnemy method
    }

    onEnd(): void {
        // Nothing either
    }
}