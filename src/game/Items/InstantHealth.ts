import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class InstantHealthItem implements Buff {
    type: BuffType = BuffType.PERM_BUFF;
    tag: string = "InstantHealthItem";
    sprite: ImagePath = new ImagePath("res/img/items/instant_health_pickup.png");

    onApply(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player

        player.health = Math.max(player.maxHealth, player.health - 50);
    }
}
