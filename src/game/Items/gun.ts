import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../player.js";
import { Item, ItemType } from "./Item.js";

export class GunItem implements Item {
    type: ItemType = ItemType.GUN;
    tag: string = "Gun";
    sprite: ImagePath = new ImagePath("res/img/items/rifle.png");

    onActivate(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player

        player.ammo = player.maxAmmo;
    }
}
