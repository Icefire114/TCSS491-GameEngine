import { AnimationState, Animator } from "../engine/Animator.js";
import { AssetManager, ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer, Vec2 } from "../engine/types.js";
import { ShaderEngine } from "../engine/WebGL/WebGL.js";
import { Background } from "./background.js";
import { BasicZombie } from "./zombies/BasicZombie.js";
import { G_CONFIG } from "./CONSTANTS.js";
import { AmmoRestore } from "./Items/AmmoRestore.js";
import { BuffEntity } from "./Items/BuffEntity.js";
import { ExplodingZombie } from "./zombies/ExplodingZombie.js";
import { FastZombie } from "./zombies/FastZombie.js";
import { GiantZombie } from "./zombies/GiantZombie.js";
import { InfectionImmunityItem } from "./Items/InfectionImmunity.js";
import { InstantHealthItem } from "./Items/InstantHealth.js";
import { ShieldRestorePickupItem } from "./Items/ShieldRestore.js";
import { Mountain } from "./worldEntities/mountain.js";
import { Player } from "./worldEntities/player.js";
import { Spike } from "./worldEntities/spike.js";
import { ThrowerZombie } from "./zombies/ThrowerZombie.js";
import { UILayer } from "./UI.js";
import { Bush } from "./worldDeco/Bush.js";
import { ChristmasTree } from "./worldDeco/ChristmasTree.js";
import { Rock } from "./worldDeco/Rock.js";
import { Tree } from "./worldDeco/Tree.js";
import { WorldSpawner } from "./WorldSpawner.js";
import { DecorationSpawner } from "./DecorationSpanwer.js";
import { unwrap } from "../engine/util.js";
import { ShopUI } from "./ShopUI.js";
import { ShockwaveBombItem } from "./Items/ShockwaveBombItem.js";
import { JumpBoostItem } from "./Items/JumpBoostItem.js";



/**
 * This is the main file for the game, and it should be considered the entry point for the game.
 */

const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine(ASSET_MANAGER);
const background = new Background();
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
ASSET_MANAGER.queueDownload("res/img/zombies/Wild Zombie/Run.png");

ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Walk_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Walk_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Idle.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Jump_R.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Jump_L.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Dead.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Attack.png");
ASSET_MANAGER.queueDownload("res/img/zombies/Thrower Zombie/Run.png");




// === Item Assets ===
ASSET_MANAGER.queueDownload("res/img/items/instant_health_pickup.png");
ASSET_MANAGER.queueDownload("res/img/items/shield_pickup.png");
ASSET_MANAGER.queueDownload("res/img/items/infection_immunity.png");
ASSET_MANAGER.queueDownload("res/img/items/infection_immunity_UI.png");
ASSET_MANAGER.queueDownload("res/img/items/rifle.png");
ASSET_MANAGER.queueDownload("res/img/items/bomb.png");
ASSET_MANAGER.queueDownload("res/img/items/boots.png");

// === Bullet Assets ===
ASSET_MANAGER.queueDownload("res/img/ammo/test_bullet.png");

// === SKY Background Assets ===
ASSET_MANAGER.queueDownload("res/img/background/background/day.png");
ASSET_MANAGER.queueDownload("res/img/background/background/night.png");
ASSET_MANAGER.queueDownload("res/img/background/sky/sun.png");
ASSET_MANAGER.queueDownload("res/img/background/sky/moon.png");

// === Background Assets ===
ASSET_MANAGER.queueDownload("res/img/background/middleground/middle1.png");
ASSET_MANAGER.queueDownload("res/img/background/middleground/middle2.png");
ASSET_MANAGER.queueDownload("res/img/background/middleground/middle3.png");
ASSET_MANAGER.queueDownload("res/img/background/middleground/middle4.png");
ASSET_MANAGER.queueDownload("res/img/background/middleground/middle5.png");

// === Foreground Assets ===
ASSET_MANAGER.queueDownload("res/img/background/foreground/fore1.png");
ASSET_MANAGER.queueDownload("res/img/background/foreground/fore2.png");
ASSET_MANAGER.queueDownload("res/img/background/foreground/fore3.png");
ASSET_MANAGER.queueDownload("res/img/background/foreground/fore4.png");
ASSET_MANAGER.queueDownload("res/img/background/foreground/fore5.png");

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
        gameEngine.positionScreenOnEnt(unwrap(gameEngine.getUniqueEntityByTag("player")), 0.15, 0.65);
        background.start();
        //gameEngine.addUniqueEntity(new Background("res/img/Plan 5.png", 150), DrawLayer.BACKGROUND);
        gameEngine.addUniqueEntity(new Mountain("Moutain_Level_01"), DrawLayer.MOUNTAIN_TERRAIN);
        gameEngine.addUniqueEntity(new ShopUI(), DrawLayer.UI_LAYER);
        gameEngine.addUniqueEntity(new UILayer(), DrawLayer.UI_LAYER);
        gameEngine.addEntity(new WorldSpawner("my-cool-seed"), DrawLayer.BACKGROUND);
        gameEngine.addEntity(new DecorationSpawner("my-cool-seed"), DrawLayer.BACKGROUND);
        // gameEngine.addEntity(new BasicZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        // gameEngine.addEntity(new BasicZombie({ x: 10, y: 0 }), DrawLayer.ZOMBIE);
        // gameEngine.addEntity(new BasicZombie({ x: 20, y: 0 }), DrawLayer.ZOMBIE);
        // gameEngine.addEntity(new ThrowerZombie({ x: 30, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ThrowerZombie({ x: 40, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new ExplodingZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new GiantZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new FastZombie({ x: 50, y: 0 }), DrawLayer.ZOMBIE);
        gameEngine.addEntity(new BasicZombie({ x: 20, y: 0 }), DrawLayer.ZOMBIE);


        gameEngine.addEntity(new Spike({ x: 80, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new Spike({ x: 82, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new Spike({ x: 84, y: 0 }), DrawLayer.SPIKE);
        gameEngine.addEntity(new BuffEntity(
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
            new BuffEntity(
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
            new BuffEntity(
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
            new BuffEntity(
                new AmmoRestore(),
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
            new BuffEntity(
                new ShockwaveBombItem(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 1,
                                frameHeight: 16,
                                frameWidth: 14,
                                sprite: new ImagePath("res/img/items/bomb.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 4, y: 4 }
                ),
                new Vec2(4, 4),
                { x: 100, y: 4 }
            ),
            DrawLayer.ITEM
        );
        gameEngine.addEntity(
            new BuffEntity(
                new JumpBoostItem(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 1,
                                frameHeight: 16,
                                frameWidth: 16,
                                sprite: new ImagePath("res/img/items/boots.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 4, y: 4 }
                ),
                new Vec2(5, 5),
                { x: 120, y: 5 }
            ),
            DrawLayer.ITEM
        );
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