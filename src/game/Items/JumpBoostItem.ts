import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class JumpBoostItem implements Buff {
    type: BuffType = BuffType.INSTANT_APPLY;
    tag: string = "JumpBoostApple";
    sprite: ImagePath = new ImagePath("res/img/items/Apple.png"); 

    onApply(): void {
        const player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        
        // Apply the multiplier
        player.jumpMultiplier = 1.5;
        
        // Back to normal after after 10 (1.0) seconds
        setTimeout(() => {
            player.jumpMultiplier = 1.0;
            console.log("Super Jump Expired (Multiplier reset to 1)");
        }, 10000);
    }
}