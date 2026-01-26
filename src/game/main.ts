import { AssetManager } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer } from "../engine/types.js";
import { Background } from "./background.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";


/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
ASSET_MANAGER.queueDownload("res/img/player.png");
ASSET_MANAGER.queueDownload("res/img/Plan 2.png");
ASSET_MANAGER.queueDownload("res/img/Plan 4.png");
ASSET_MANAGER.queueDownload("res/img/Plan 5.png");
ASSET_MANAGER.queueDownload("res/img/sun.png");
ASSET_MANAGER.queueDownload("res/img/cloud.png");

ASSET_MANAGER.downloadAll((errorCount, successCount) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    console.log(`Successfully loaded ${successCount} assets!`);

    main();
})

function main() {
    gameEngine.addEntity(new Player(), DrawLayer.HIGHEST)
    gameEngine.addEntity(new Mountain(), DrawLayer.of(DrawLayer.HIGHEST - 1))
    gameEngine.addEntity(new Background("res/img/Plan 5.png", 150), DrawLayer.of(DrawLayer.HIGHEST - 2));
    

    try {
        gameEngine.start();
    } catch (e) {
        console.error(`Engine has encounted an uncaught error! ${e}`);
        alert(`Engine has encounted an uncaught error! ${e}`);
    }
}