import { ImagePath } from "../../engine/assetmanager.js";

export enum ItemType {
    GUN,
    PERM_BUFF,
    TEMP_BUFF,
    INSTANT_APPLY,
}

export type Item = {
    type: ItemType,
    /**
     * These should be unique per item.
     */
    tag: string,
    sprite: ImagePath,

    /**
     * Called when the item is picked up in the case of a buff, 
     * or when the item is used in the case of a gun.
     */
    onActivate(): void;
}
