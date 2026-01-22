import { AssetManager } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer } from "../engine/types.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";

/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
ASSET_MANAGER.queueDownload("res/img/player.png");
ASSET_MANAGER.queueDownload("res/img/player_new.png");
ASSET_MANAGER.queueDownload("res/img/snowboard.png");

ASSET_MANAGER.downloadAll((errorCount, successCount) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    console.log(`Successfully loaded ${successCount} assets!`);

    main();
})

function main() {
    gameEngine.addUniqueEntity(new Player(), DrawLayer.HIGHEST)
    gameEngine.addUniqueEntity(new Mountain(), DrawLayer.of(DrawLayer.HIGHEST - 1));

    try {
        gameEngine.start();
    } catch (e) {
        console.error(`Engine has encounted an uncaught error! ${e}`);
        alert(`Engine has encounted an uncaught error! ${e}`);
    }
}