import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity } from "../engine/Entity.js";
import { DrawLayer, Vec2 } from "../engine/types.js";
import { BackgroundLayer } from "./backgroundLayer.js";

/**
 * @author JK
 * @description The main background class.
 */
export class Background implements Entity {
    velocity: Vec2 = GameEngine.g_INSTANCE.getEntityByTag("player")!.velocity;
    position: Vec2 = new Vec2();
    physicsCollider = null;
    sprite: ImagePath;

    removeFromWorld: boolean = false;
    tag: string = "background";
    
    playerPosition: Vec2 = GameEngine.g_INSTANCE.getEntityByTag("player")!.position;
    widthInWorldUnits: number;
    gameLayers: BackgroundLayer[] = [];

    constructor(spritePath: string, widthInWorldUnits: number = 100, startX: number = 0, startY: number = 9450) {
        this.sprite = new ImagePath(spritePath);
        this.position.x = startX;
        this.position.y = startY;
        this.widthInWorldUnits = widthInWorldUnits;
        this.init();
        console.log(startX, startY);
    }

    init():void {
        const layer1 = new BackgroundLayer("res/img/Plan 4.png", 0.0008);
        const layer2 = new BackgroundLayer("res/img/Plan 2.png", 0.002);
        const layer3 = new BackgroundLayer("res/img/cloud.png", 0.008, 20, 80, 9400, false);

        this.gameLayers = [layer1, layer2, layer3];

        // GameEngine.g_INSTANCE.addEntity(layer1, DrawLayer.of(DrawLayer.HIGHEST));
        // GameEngine.g_INSTANCE.addEntity(layer2, DrawLayer.of(DrawLayer.HIGHEST - 1));
        // GameEngine.g_INSTANCE.addEntity(layer3, DrawLayer.of(DrawLayer.HIGHEST - 2));
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);

        const player_width_in_world_units = this.widthInWorldUnits;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.drawImage(
            sprite,
            screenX - w / 2,
            screenY - h,
            w,
            h
        );

        this.gameLayers.forEach(layer => {
            layer.draw(ctx, game);
        });
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.gameLayers.forEach(layer => {
            layer.update(keys, deltaTime);
        });

        this.position.x = this.playerPosition.x + 10;
        this.position.y = this.playerPosition.y + 40;
    }
}
