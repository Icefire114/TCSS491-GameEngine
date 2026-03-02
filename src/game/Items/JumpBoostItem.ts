import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType, TempBuff } from "./Buff.js";

export class JumpBoostItem implements Buff, TempBuff {
    type: BuffType = BuffType.TEMP_BUFF;
    tag: string = "JumpBoostApple";
    sprite: ImagePath = new ImagePath("res/img/items/boots.png");

    startingDuration: number = 10;
    currentDuration: number = this.startingDuration;

    private oldJumpMultiplier: number = 0;

    onApply(): void {
        const player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;

        this.oldJumpMultiplier = player.jumpMultiplier;
        // Apply the multiplier
        player.jumpMultiplier = 1.5;
    }

    onEnd(): void {
        const player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        player.jumpMultiplier = this.oldJumpMultiplier;
    }
}