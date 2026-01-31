import { ImagePath } from "../../engine/assetmanager.js";
import { Item, ItemType, TempBuff } from "./Item.js";

export class InfectionImmunityItem implements Item, TempBuff {
    type: ItemType = ItemType.TEMP_BUFF;
    tag: string = "InfectionImmunityItem";
    sprite: ImagePath = new ImagePath("res/img/items/infection_immunity_UI.png");

    tooltip: string = "Grants temporary immunity to infection!";

    startingDuration: number = 10;
    currentDuration: number = this.startingDuration;

    onActivate(): void {
    }
}
