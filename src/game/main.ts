import { AnimationState, Animator } from "../engine/Animator.js";
import { AssetManager, ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer } from "../engine/types.js";
import { Background } from "./background.js";
import { BasicZombie } from "./BasicZombie.js";
import { InfectionImmunityItem } from "./Items/InfectionImmunity.js";
import { InstantHealthItem } from "./Items/InstantHealth.js";
import { ItemEntity } from "./Items/ItemEntity.js";
import { ShieldRestorePickupItem } from "./Items/ShieldRestore.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { Spike } from "./spike.js";
import { ThrowerZombie } from "./ThrowerZombie.js";
import { UILayer } from "./UI.js";


/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
ASSET_MANAGER.queueDownload("res/img/player_new.png");
ASSET_MANAGER.queueDownload("res/img/snowboard.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Idle.png");


// === Zombie Assets ===
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

// === Item Assets ===
ASSET_MANAGER.queueDownload("res/img/items/instant_health_pickup.png");
ASSET_MANAGER.queueDownload("res/img/items/shield_pickup.png");
ASSET_MANAGER.queueDownload("res/img/items/infection_immunity.png");
ASSET_MANAGER.queueDownload("res/img/items/infection_immunity_UI.png");

// === Background Assets ===
ASSET_MANAGER.queueDownload("res/img/Plan 2.png");
ASSET_MANAGER.queueDownload("res/img/Plan 4.png");
ASSET_MANAGER.queueDownload("res/img/Plan 5.png");
ASSET_MANAGER.queueDownload("res/img/sun.png");
ASSET_MANAGER.queueDownload("res/img/cloud.png");

// === Music Assets ===
ASSET_MANAGER.queueDownload("res/aud/game_music.ogg");

// === World Object Assets ===
ASSET_MANAGER.queueDownload("res/img/spike.png");

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
        gameEngine.addUniqueEntity(new Player(), DrawLayer.PLAYER);
        //gameEngine.addUniqueEntity(new Background("res/img/Plan 5.png", 150), DrawLayer.BACKGROUND);
        gameEngine.addUniqueEntity(new Mountain(), DrawLayer.MOUNTAIN_TERRAIN);
        gameEngine.addUniqueEntity(new UILayer(), DrawLayer.UI_LAYER);

        gameEngine.addEntity(new BasicZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new BasicZombie({ x: 10, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new BasicZombie({ x: 20, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ThrowerZombie({ x: 30, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ThrowerZombie({ x: 40, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new Spike({ x: 80, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new Spike({ x: 82, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new Spike({ x: 84, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new ItemEntity(
            new InfectionImmunityItem(),
            new Animator([
                [
                    {
                        frameCount: 15,
                        frameHeight: 51,
                        frameWidth: 39,
                        offestX: -0.5,
                        sprite: new ImagePath("res/img/items/infection_immunity.png")
                    },
                    AnimationState.IDLE
                ]
            ],
                { x: 3, y: 3 }
            ),
            { x: 90, y: 0 })
            , DrawLayer.ITEM);


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
                                offestX: -0.5,
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
                                offestX: -0.5,
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