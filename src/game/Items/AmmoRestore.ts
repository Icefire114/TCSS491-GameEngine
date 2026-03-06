import { AudioPath, ImagePath } from "../../engine/assetmanager.js";
import { AudioManager } from "../../engine/AudioManager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class AmmoRestore implements Buff {
    type: BuffType = BuffType.INSTANT_APPLY;
    tag: string = "AmmoRestore";
    sprite: ImagePath = new ImagePath("res/img/items/AmmoBox.png");

    onApply(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player
        AudioManager.playSFX(new AudioPath("res/aud/sfx/items/ammoRestore.wav"));
        player.weapon.ammoOnHand += player.weapon.ammoBox;
    }
}
