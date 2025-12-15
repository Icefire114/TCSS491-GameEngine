import { AssetManager } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";

const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();


ASSET_MANAGER.downloadAll((_, errorCount: number) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`)
    }
    const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D;

    gameEngine.init(ctx);
    gameEngine.start();
})