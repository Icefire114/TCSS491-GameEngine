import { AssetManager } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Player } from "./player.js";

/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();


function main() {
    gameEngine.addEntity(new Player())

    gameEngine.start();
}

ASSET_MANAGER.downloadAll((_, errorCount: number) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    console.log(`CTX IS: ${ctx}`);

    gameEngine.init(ctx);
    main();
})


