import { GameEngine } from "../engine/gameengine.js";
import { Entity } from "../engine/types.js";

export class Player implements Entity {
    X: number = 0;
    Y: number = 0;
    removeFromWorld: boolean = false;

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.fillStyle = "#5a2100";
        ctx.fillRect(this.X, this.Y, 10, 10);
    }

    update(): void {
        // throw new Error("Method not implemented.");
    }
}