import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../player.js";
import { Item, ItemType } from "./Item.js";

export class ShieldRestorePickupItem implements Item {
    type: ItemType = ItemType.PERM_BUFF;
    tag: string = "ShieldRestorePickupItem";
    sprite: ImagePath = new ImagePath("res/img/items/shield_pickup.png");

    onActivate(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player;

        player.shield = Math.min(player.maxShield, player.shield + 25);
    }
}
