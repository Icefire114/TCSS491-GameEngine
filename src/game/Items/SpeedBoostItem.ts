import { Buff, BuffType, TempBuff } from "./Buff.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Player } from "../worldEntities/player.js";

export class SpeedBoostItem implements Buff, TempBuff {
    type: BuffType = BuffType.TEMP_BUFF;
    tag: string = "speed_boost";
    sprite: ImagePath = new ImagePath("res/img/items/energy_drink.png");
    
    startingDuration: number = 8; 
    currentDuration: number = 8;

    onApply(): void {
        // Boost max speed and acceleration
        Player.MAX_SPEED += 100;
        Player.ACCELERATION += 50;
    }

    onEnd(): void {
        // Reverting back to normal when it ends
        Player.MAX_SPEED -= 100;
        Player.ACCELERATION -= 50;
    }
}