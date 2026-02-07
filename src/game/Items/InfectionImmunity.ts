import { ImagePath } from "../../engine/assetmanager.js";
import { Buff, BuffType, TempBuff } from "./Buff.js";

export class InfectionImmunityItem implements Buff, TempBuff {
    type: BuffType = BuffType.TEMP_BUFF;
    tag: string = "InfectionImmunityItem";
    sprite: ImagePath = new ImagePath("res/img/items/infection_immunity_UI.png");

    tooltip: string = "Grants temporary immunity to infection!";

    startingDuration: number = 10;
    currentDuration: number = this.startingDuration;

    onApply(): void {
    }
}
