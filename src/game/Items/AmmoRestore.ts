import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../player.js";
import { Buff, BuffType } from "./Buff.js";

export class AmmoRestore implements Buff {
    type: BuffType = BuffType.INSTANT_APPLY;
    tag: string = "AmmoRestore";
    sprite: ImagePath = new ImagePath("res/img/items/rifle.png");

    onApply(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player

        player.ammo = player.maxAmmo;
    }
}
