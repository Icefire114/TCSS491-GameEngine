import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Background } from "./Background.js";
import { DayNightCycle } from "./DayNightCycle.js";

export class SkyLayer extends Background {
    static TAG: string = "SkyLayer";
    daySprite: ImagePath;
    nightSprite: ImagePath;
    rareNightSprite: ImagePath;

    constructor(parallaxSpeed: number, spritePaths: ImagePath[]) {
        super(SkyLayer.TAG, spritePaths, parallaxSpeed);

        this.daySprite = spritePaths[0];
        this.nightSprite = spritePaths[1];
        this.rareNightSprite = spritePaths[2];
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        this.position = this.player.position;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const dayNight = game.getUniqueEntityByTag("DayNightCycle") as DayNightCycle;
        const intro = game.getUniqueEntityByTag("intro_screen") as any;
        const blendAlpha = intro ? intro.getAlpha() : 0;

        const daySprite  = game.getSprite(this.daySprite);
        const nightSprite = game.getSprite(this.rareNightSprite)


        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const w = this.worldWidth * scale;
        const h = daySprite.height * (w / daySprite.width);

        const screenY = ctx.canvas.height;

        // Always draw day sky fully opaque as the base
        ctx.globalAlpha = 1;
        ctx.drawImage(daySprite, 0, screenY - h, w, h);

        // Blend night sky on top based on time of day
        ctx.globalAlpha = dayNight.timeOfDayAlpha;
        ctx.drawImage(nightSprite, 0, screenY - h, w, h);
        ctx.globalAlpha = 1;

        this.blueSmokeDrawing(ctx, blendAlpha);
    }

}