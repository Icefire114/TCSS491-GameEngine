import { ImagePath } from "../engine/assetmanager";

export enum ItemType {
    GUN,
    PERM_BUFF,
    TEMP_BUFF,
}

export type Item = {
    type: ItemType,
    /**
     * These should be unique per item.
     */
    id: string,
    sprite: ImagePath,

    onUse(): void;
}
