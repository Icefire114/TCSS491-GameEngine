import { EntityID } from "../../engine/Entity.js";
import { Background } from "./Background.js";
import { ImagePath } from "../../engine/assetmanager.js";

export class ForegroundLayer extends Background {
    static TAG: string = "ForegroundLayer";

    constructor(parallaxSpeed: number, spritePaths: ImagePath[]) {
        super(ForegroundLayer.TAG, spritePaths, parallaxSpeed);
    }
}