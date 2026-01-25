import { AnimationState, Animator } from "../engine/Animator.js";
import { AssetManager, ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer } from "../engine/types.js";
import { BasicZombie } from "./BasicZombie.js";
import { InstantHealthItem } from "./Items/InstantHealth.js";
import { ItemEntity } from "./Items/ItemEntity.js";
import { ShieldRestorePickupItem } from "./Items/ShieldRestore.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { ThrowerZombie } from "./ThrowerZombie.js";
import { UILayer } from "./UI.js";

/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
ASSET_MANAGER.queueDownload("res/img/player.png");
ASSET_MANAGER.queueDownload("res/img/player_new.png");
ASSET_MANAGER.queueDownload("res/img/snowboard.png");

ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Idle.png");

ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Walk_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Walk_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Idle.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Jump_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Jump_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Dead.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Walk_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Walk_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Idle.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Jump_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Jump_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Dead.png");

ASSET_MANAGER.queueDownload("res/img/items/instant_health_pickup.png");
ASSET_MANAGER.queueDownload("res/img/items/shield_pickup.png");

ASSET_MANAGER.downloadAll((errorCount, successCount) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    console.log(`Successfully loaded ${successCount} assets!`);

    main();
})

function main() {
    try {
        gameEngine.addUniqueEntity(new Player(), DrawLayer.HIGHEST);
        gameEngine.addUniqueEntity(new Mountain(), DrawLayer.MOUNTAIN_TERRAIN);
        gameEngine.addUniqueEntity(new UILayer(), DrawLayer.UI_LAYER);

        gameEngine.addEntity(new BasicZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new BasicZombie({ x: 10, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new BasicZombie({ x: 20, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ThrowerZombie({ x: 30, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ThrowerZombie({ x: 40, y: 0 }), DrawLayer.ZOMBIE);

        gameEngine.addEntity(
            new ItemEntity(
                new InstantHealthItem(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 4,
                                frameHeight: 40,
                                frameWidth: 42,
                                sprite: new ImagePath("res/img/items/instant_health_pickup.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 3, y: 3 }
                ),
                { x: 60, y: 0 })
            , DrawLayer.ITEM);
        gameEngine.addEntity(
            new ItemEntity(
                new ShieldRestorePickupItem(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 10,
                                frameHeight: 64,
                                frameWidth: 54,
                                sprite: new ImagePath("res/img/items/shield_pickup.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 3, y: 3 }
                ),
                { x: 70, y: 0 }
            ),
            DrawLayer.ITEM
        )
        gameEngine.start();
    } catch (e) {
        console.error(`Engine has encounted an uncaught error! ${e}`);
        alert(`Engine has encounted an uncaught error! ${e}`);
        throw e;
    }
}