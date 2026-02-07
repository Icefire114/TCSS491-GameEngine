import { ImagePath } from "../../engine/assetmanager.js";

export enum ItemType {
    GUN,
    MISC
}

export type Item = {
    type: ItemType,
    /**
     * These should be unique per item.
     */
    tag: string,
    sprite: ImagePath,

    /**
     * Called when the item is picked up, or when the item is used in the case of a gun.
     */
    onActivate(): void;
}
