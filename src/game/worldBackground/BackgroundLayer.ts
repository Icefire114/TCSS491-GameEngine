import { ImagePath } from "../../engine/assetmanager.js";
import { Background } from "./Background.js";

export class BackgroundLayer extends Background {
    static TAG: string = "BackgroundLayer";

    constructor(parallaxSpeed: number, spritePaths: ImagePath[]) {
        super(BackgroundLayer.TAG, spritePaths, parallaxSpeed);
    }

}