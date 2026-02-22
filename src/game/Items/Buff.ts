import { ImagePath } from "../../engine/assetmanager.js";

export enum BuffType {
    // Used for buffs that last forever (max health boosts)
    PERM_BUFF,
    // Used for buffs that last a set amount of time
    TEMP_BUFF,
    // Used for one off apply effects, such as a helth restore or similar.
    INSTANT_APPLY,
}

export type Buff = {
    type: BuffType,
    /**
     * These should be unique per item.
     */
    tag: string,
    sprite: ImagePath,

    /**
     * Called when the buff is applied to the player.
     */
    onApply(): void;
}

export type TempBuff = {
    /**
     * The duration of the buff in seconds.
     */
    startingDuration: number;

    /**
     * The amount of time remaining on the buff.
     */
    currentDuration: number;

    /**
     * Called when the buff ends
     */
    onEnd(): void;
}