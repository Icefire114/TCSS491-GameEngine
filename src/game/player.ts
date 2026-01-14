import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity } from "../engine/types.js";
import { clamp } from "../engine/util.js";

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity {
    sprite: ImagePath = new ImagePath("res/img/player.png");
    X: number = 0;
    Y: number = 0;
    removeFromWorld: boolean = false;
    tag: string = "player";

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.drawImage(game.getSprite(this.sprite), (this.X - game.viewportX) / game.zoom, (this.Y - game.viewportY) / game.zoom);
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        if (keys["a"]) {
            this.X = clamp(this.X - 200 * deltaTime, 0, Infinity)
        }
        if (keys["d"]) {
            this.X += 200 * deltaTime
        }

        /// TODO(pg): Move down per frame, check collision with mountain (prolly should have GameEngine handle that)

    }
}
