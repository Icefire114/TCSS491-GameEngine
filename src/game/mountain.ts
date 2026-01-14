import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity } from "../engine/types.js";
import { clamp } from "../engine/util.js";

export class Mountain implements Entity {
    tag = "mountain";

    constructor() {
        // Load the default level into the engine
        fetch('res/levels/main.json').then(response => response.json()).then(data => {
            GameEngine.g_INSTANCE.terrainData = data;
        });
    }

    X: number = 0;
    Y: number = 0;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (GameEngine.g_INSTANCE.terrainData == null) {
            console.error("Mountain terrain data not yet loaded!");
            return;
        }

        const player = game.getEntityByTag("player");

        if (!player) {
            throw new Error("Player not found!");
        }

        const lower = clamp(Math.floor(player.X) - 20, 0, GameEngine.g_INSTANCE.terrainData.y.length)
        const upper = clamp(Math.floor(player.X) + 20, 0, GameEngine.g_INSTANCE.terrainData.y.length)

        let nodesToRender: number[] = GameEngine.g_INSTANCE.terrainData.y.slice(lower, upper);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}