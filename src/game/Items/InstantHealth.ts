import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Player } from "../player.js";
import { Item, ItemType } from "./Item.js";

export class InstantHealthItem implements Item {
    type: ItemType = ItemType.PERM_BUFF;
    tag: string = "InstantHealthItem";
    sprite: ImagePath = new ImagePath("res/img/items/instant_health_pickup.png");

    onActivate(): void {
        const player: Player | undefined = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) {
            throw new Error(`Could not find player entity!`);
        }
        player.health = Math.max(player.maxHealth, player.health - 50);
    }
}
