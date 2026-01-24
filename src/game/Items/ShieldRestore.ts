import { ImagePath } from "../../engine/assetmanager.js";
import { Item, ItemType } from "./Item.js";

export class ShieldRestorePickupItem implements Item {
    type: ItemType = ItemType.TEMP_BUFF;
    tag: string = "ShieldRestorePickupItem";
    sprite: ImagePath = new ImagePath("res/img/items/shield_pickup.png");

    onActivate(): void {
        throw new Error("Method not implemented.");
    }
}
