import { AnimationState, Animator } from "../engine/Animator.js";
import { AssetManager, ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer, Vec2 } from "../engine/types.js";
import { ShaderEngine } from "../engine/WebGL/WebGL.js";
import { Background } from "./background.js";
import { BasicZombie } from "./BasicZombie.js";
import { G_CONFIG } from "./CONSTANTS.js";
import { GunItem } from "./Items/gun.js";
import { InfectionImmunityItem } from "./Items/InfectionImmunity.js";
import { InstantHealthItem } from "./Items/InstantHealth.js";
import { ItemEntity } from "./Items/ItemEntity.js";
import { ShieldRestorePickupItem } from "./Items/ShieldRestore.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { Spike } from "./spike.js";
import { ThrowerZombie } from "./ThrowerZombie.js";
import { UILayer } from "./UI.js";
import { Bush } from "./worldDeco/Bush.js";
import { ChristmasTree } from "./worldDeco/ChristmasTree.js";
import { Rock } from "./worldDeco/Rock.js";
import { Tree } from "./worldDeco/Tree.js";
import { WorldSpawner } from "./WorldSpawner.js";


/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
ASSET_MANAGER.queueDownload("res/img/player_new.png");
ASSET_MANAGER.queueDownload("res/img/snowboard.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Idle.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Dead.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Shot_2.png");


// === Zombie Assets ===
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Walk_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Walk_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Idle.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Jump_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Jump_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Dead.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Attack_1.png");
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
ASSET_MANAGER.queueDownload("res/img/items/rifle.png");

// === Bullet Assets ===
ASSET_MANAGER.queueDownload("res/img/ammo/test_bullet.png");

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
ASSET_MANAGER.queueDownload("res/img/world_deco/tree_1.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/tree_2.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/bush_1.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/berry_bush_1.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/berry_bush_2.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/rock_1.png");

ASSET_MANAGER.downloadAll((errorCount, successCount) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    console.log(`Successfully loaded ${successCount} assets!`);

    main();
})

function main() {
    if (!ShaderEngine.isWebGL2Supported() || !G_CONFIG.NEW_RENDERER) {
        console.warn(`WebGL2 Unsupported or disabled NEW_RENDERER=${G_CONFIG.NEW_RENDERER}!`);
        if (G_CONFIG.NEW_RENDERER) {
            alert("[!] WebGL2 is not supported! Some features may not work correctly! And assets may not be displayed correctly!");
        } else {
            alert("[!] WebGL support has been disabled! Lets hope things are feature flagged correctly :)");
        }
    } else {
        console.log("WebGL2 Supported!");
    }


    try {
        gameEngine.addUniqueEntity(new Player(), DrawLayer.PLAYER);
        gameEngine.addUniqueEntity(new Background("res/img/Plan 5.png", 150), DrawLayer.BACKGROUND);
        gameEngine.addUniqueEntity(new Mountain("Moutain_Level_01"), DrawLayer.MOUNTAIN_TERRAIN);
        gameEngine.addUniqueEntity(new UILayer(), DrawLayer.UI_LAYER);
        gameEngine.addEntity(new WorldSpawner("my-cool-seed"), DrawLayer.BACKGROUND);
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
                        sprite: new ImagePath("res/img/items/infection_immunity.png")
                    },
                    AnimationState.IDLE
                ]
            ],
                { x: 3, y: 3 }
            ),
            new Vec2(3, 3),
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
                                sprite: new ImagePath("res/img/items/instant_health_pickup.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 3, y: 3 }
                ),
                new Vec2(3, 3),
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
                new Vec2(3, 3),
                { x: 70, y: 0 }
            ),
            DrawLayer.ITEM
        )
        gameEngine.addEntity(
            new ItemEntity(
                new GunItem(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 7,
                                frameHeight: 24,
                                frameWidth: 43,
                                offestX: 0.1,
                                sprite: new ImagePath("res/img/items/rifle.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 6, y: 3 }
                ),
                new Vec2(6, 3),
                { x: 13, y: 0 }
            ),
            DrawLayer.ITEM
        )

        gameEngine.addEntity(
            new Tree(
                new Vec2(
                    132,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Bush(
                new Vec2(
                    149,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Bush(
                new Vec2(
                    168,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Bush(
                new Vec2(
                    184,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Bush(
                new Vec2(
                    200,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Bush(
                new Vec2(
                    218,
                    0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new Rock(
                new Vec2(230, 0)
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.addEntity(
            new ChristmasTree(
                new Vec2(
                    300, 0
                )
            ),
            DrawLayer.WORLD_DECORATION
        );
        gameEngine.start();
    } catch (e) {
        console.error(`Engine has encounted an uncaught error! ${e}`);
        alert(`Engine has encounted an uncaught error! ${e}`);
        throw e;
    }
}