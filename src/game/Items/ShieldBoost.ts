import { AudioPath, ImagePath } from "../../engine/assetmanager.js";
import { AudioManager } from "../../engine/AudioManager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class ShieldRestorePickupItem implements Buff {
    type: BuffType = BuffType.PERM_BUFF;
    tag: string = "ShieldRestorePickupItem";
    sprite: ImagePath = new ImagePath("res/img/items/shield_pickup.png");

    onApply(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player;
        AudioManager.playSFX(new AudioPath("res/aud/sfx/items/shieldBoost2.wav"), 0.7);
        player.maxHealth = player.maxHealth + 25;
    }
}
