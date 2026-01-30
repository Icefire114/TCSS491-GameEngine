import { ImagePath } from "../../engine/assetmanager.js";
import { Item, ItemType } from "./Item.js";

export class InstantHealthItem implements Item {
    type: ItemType = ItemType.INSTANT_APPLY;
    tag: string = "InstantHealthItem";
    sprite: ImagePath = new ImagePath("res/img/items/instant_health_pickup.png");

    onActivate(): void {
        throw new Error("Method not implemented.");
    }
}
