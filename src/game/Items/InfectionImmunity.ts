import { ImagePath } from "../../engine/assetmanager.js";
import { Item, ItemType } from "./Item.js";

export class InfectionImmunityItem implements Item {
    type: ItemType = ItemType.TEMP_BUFF;
    tag: string = "InfectionImmunityItem";
    sprite: ImagePath = new ImagePath("res/img/items/infection_immunity.png");

    tooltip: string = "Grants temporary immunity to infection!";


    /**
     * The duration of the buff in seconds.
     */
    startingDuration: number = 10;

    /**
     * The amount of time remaining on the buff.
     */
    currentDuration: number = this.startingDuration;

    onActivate(): void {
        throw new Error("Method not implemented.");
    }
}
