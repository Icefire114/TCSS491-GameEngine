import { AnimationState, Animator } from "../engine/Animator.js";
import { AssetManager, ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer, Vec2 } from "../engine/types.js";
import { WebGL } from "../engine/WebGL/WebGL.js";
import { Background } from "./background.js";
import { BasicZombie } from "./zombies/BasicZombie.js";
import { G_CONFIG } from "./CONSTANTS.js";
import { AmmoRestore } from "./Items/AmmoRestore.js";
import { BuffEntity } from "./Items/BuffEntity.js";
import { ExplodingZombie } from "./zombies/ExplodingZombie.js";
import { FastZombie } from "./zombies/FastZombie.js";
import { GiantZombie } from "./zombies/GiantZombie.js";
import { InfectionImmunityItem } from "./Items/InfectionImmunity.js";
import { InstantHealthPickupBuff } from "./Items/InstantHealthPickupBuff.js";
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
import { WorldSpawner } from "./worldEntities/WorldSpawner.js";
import { DecorationSpawner } from "./worldDeco/DecorationSpanwer.js";
import { unwrap } from "../engine/util.js";
import { ShopUI } from "./worldEntities/SafeZone/ShopUI.js";
import { ShockwaveBombItem } from "./Items/ShockwaveBombItem.js";
import { JumpBoostItem } from "./Items/JumpBoostItem.js";
import { ArmoryUI } from "./worldEntities/SafeZone/ArmoryUI.js";
import { IntroScreen } from "./IntroScreen.js";
import { BossArena } from "./worldEntities/BossArena.js"



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
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/Recharge.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/IdleRPG.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/shotRPG.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/ReloadRPG.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/ReloadRay.png");
ASSET_MANAGER.queueDownload("res/img/soldiers/Soldier_1/IdleRay.png");



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
ASSET_MANAGER.queueDownload("res/img/items/AmmoBox.png");
ASSET_MANAGER.queueDownload("res/img/items/assult_rifle.png");
ASSET_MANAGER.queueDownload("res/img/items/rpg.png");
ASSET_MANAGER.queueDownload("res/img/items/ray_gun.png");

// === Guns Assets ===
ASSET_MANAGER.queueDownload("res/img/guns/assult_rifle/Shot.png");
ASSET_MANAGER.queueDownload("res/img/guns/RPG/Shot.png");
ASSET_MANAGER.queueDownload("res/img/guns/ray_gun/Shot.png");
ASSET_MANAGER.queueDownload("res/img/guns/IdleGun.png");

// === Bullet Assets ===
ASSET_MANAGER.queueDownload("res/img/ammo/RifleBullet.png");
ASSET_MANAGER.queueDownload("res/img/ammo/test_bullet.png");
ASSET_MANAGER.queueDownload("res/img/ammo/RPGRocket.png");
ASSET_MANAGER.queueDownload("res/img/ammo/RPGExplode.png");
ASSET_MANAGER.queueDownload("res/img/ammo/Lazer.png");



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
ASSET_MANAGER.queueDownload("res/img/world_deco/fire_barrel.png");
ASSET_MANAGER.queueDownload("res/img/world_deco/crate.png");

// === Safe Zone Assets ===
ASSET_MANAGER.queueDownload("res/img/safe_zone/turret_wall.png");
ASSET_MANAGER.queueDownload("res/img/safe_zone/turret.png");
ASSET_MANAGER.queueDownload("res/img/safe_zone/shop.png");
ASSET_MANAGER.queueDownload("res/img/safe_zone/testArmory.png");

// === Shader Assets ===
ASSET_MANAGER.queueDownload("res/shader/sun.frag.glsl");
ASSET_MANAGER.queueDownload("res/shader/snow.frag.glsl");
ASSET_MANAGER.queueDownload("res/shader/christmas_light.frag.glsl");


ASSET_MANAGER.downloadAll((errorCount, successCount) => {
    if (errorCount > 0) {
        console.error(`Error loading assets ${errorCount} of them failed to load!`);
        alert(`Failed to load ${errorCount} assets! The game may not function correctly!`);
    }
    console.log(`Successfully loaded ${successCount} assets!`);

    main();
})

function main() {
    if (!WebGL.isWebGL2Supported()) {
        console.warn(`WebGL2 Unsupported!`);
        alert("[!] WebGL2 is not supported! Some features may not work correctly! And assets may not be displayed correctly!");
    } else {
        console.log("WebGL2 Supported!");
        WebGL.initWebGL(ASSET_MANAGER);
    }


    try {
        GameEngine.g_INSTANCE.addUniqueEntity(new Player(new Vec2(55, 0)), DrawLayer.PLAYER);
        gameEngine.positionScreenOnEnt(unwrap(gameEngine.getUniqueEntityByTag("player")), 0.15, 0.65);
        gameEngine.snapViewportToFollowedEnt();
        background.start();
        //gameEngine.addUniqueEntity(new Background("res/img/Plan 5.png", 150), DrawLayer.BACKGROUND);
        gameEngine.addUniqueEntity(new Mountain("Moutain_Level_01"), DrawLayer.MOUNTAIN_TERRAIN);
        const shopUI: ShopUI = gameEngine.addUniqueEntity(new ShopUI(), DrawLayer.UI_LAYER) as ShopUI;
        const armoryUI: ArmoryUI = gameEngine.addUniqueEntity(new ArmoryUI(), DrawLayer.UI_LAYER) as ArmoryUI;
        gameEngine.addUniqueEntity(new UILayer(shopUI, armoryUI), DrawLayer.UI_LAYER);
        gameEngine.addUniqueEntity(new WorldSpawner("my-cool-seed"), DrawLayer.BACKGROUND);
        gameEngine.addUniqueEntity(new DecorationSpawner("my-cool-seed"), DrawLayer.BACKGROUND);

        //testing boss arena
        //todo: fix background problems with boss arena
        gameEngine.addEntity(new BossArena(100,250), DrawLayer.DEFAULT);

        if (G_CONFIG.CREATE_TESTING_ENTS) {
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


            gameEngine.addEntity(new BuffEntity(
                new InstantHealthPickupBuff(),
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
            gameEngine.addEntity(new BuffEntity(
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
            gameEngine.addEntity(new BuffEntity(
                new AmmoRestore(),
                new Animator(
                    [
                        [
                            {
                                frameCount: 8,
                                frameHeight: 22,
                                frameWidth: 30,

                                sprite: new ImagePath("res/img/items/AmmoBox.png")
                            },
                            AnimationState.IDLE
                        ]
                    ],
                    { x: 6, y: 4 }
                ),
                new Vec2(6, 4),
                { x: 20, y: 0 }
            ),
                DrawLayer.ITEM
            )
            gameEngine.addEntity(new BuffEntity(
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
            gameEngine.addEntity(new BuffEntity(
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
            gameEngine.addEntity(new Tree(
                new Vec2(
                    132,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Bush(
                new Vec2(
                    149,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Bush(
                new Vec2(
                    168,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Bush(
                new Vec2(
                    184,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Bush(
                new Vec2(
                    200,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Bush(
                new Vec2(
                    218,
                    0
                )
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new Rock(
                new Vec2(230, 0)
            ), DrawLayer.WORLD_DECORATION);
            gameEngine.addEntity(new ChristmasTree(
                new Vec2(
                    300, 0
                )
            ), DrawLayer.WORLD_DECORATION);
        }

        // Drawing our intro screen at the top, and will called gameengine start to start the geame
        gameEngine.addUniqueEntity(new IntroScreen(() => {
            gameEngine.start();
        }), 999 as DrawLayer);

        // Update loop is going, but intro is the one that calls the gameengine.start
        gameEngine.loop();
    } catch (e) {
        console.error(`Engine has encounted an uncaught error! ${e}`);
        alert(`Engine has encounted an uncaught error! ${e}`);
        throw e;
    }
}