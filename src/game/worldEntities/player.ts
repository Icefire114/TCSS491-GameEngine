import { AudioPath, ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { DrawLayer } from "../../engine/types.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Item } from "../Items/Item.js";
import { ItemEntity } from "../Items/ItemEntity.js";
import { Collidable } from "../../engine/physics/Collider.js";
import { Mountain } from "./mountain.js";
import { AnimationState, Animator, AnimationEvent } from "../../engine/Animator.js";
import { G_CONFIG } from "../CONSTANTS.js";
import { Buff, BuffType, TempBuff } from "../Items/Buff.js";
import { BuffEntity } from "../Items/BuffEntity.js";
import { Zombie } from "../zombies/Zombie.js";
import { Gun } from "../Items/guns/Gun.js";
import { RPG } from "../Items/guns/RPG.js";
import { AssultRifle } from "../Items/guns/AssultRifle.js";
import { DeathScreen } from "../DeathScreen.js";
import { RavineDeathZone } from "./RavineZone.js";
import { RayGun } from "../Items/guns/RayGun.js";
import { UILayer } from "../UI.js";
import { AudioManager } from "../../engine/AudioManager.js";
import { clamp } from "../../engine/util.js";


export type DamageType = "Infection" | "Health";

/**
 * The players current state
 */
enum PlayerState {
    IDLE,
    SLIDING,
    AIRBORNE,
    JUMPING,
}

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity, Collidable {

    /**
     * Movement tuning constants
     */
    static MIN_SPEED = 15;
    static MAX_SPEED = 250;
    static SLIDE_FORCE = 50;
    static ACCELERATION = 90;
    static BRAKE_FORCE = 200;
    static FRICTION = 0.01;
    static JUMP_FORCE = -25;
    static SLOPE_GRAVITY_MULT = 1.2;
    static LIFTOFF_THRESHOLD = 30;

    private prevState: PlayerState = PlayerState.IDLE;
    private currentState: PlayerState = PlayerState.IDLE;

    private prevGroundSpeed: number = 0;
    private jumpCooldown: number = 0;

    /**
     * Snowboard rotation state
     */
    private boardRotation: number = 0;

    /**
     * All weapons
     */
    private rpg: RPG;
    private rifle: AssultRifle;
    private rayGun: RayGun;

    /**
     * store the target for when the animation fires
     */
    private queuedShotTarget: Vec2 | null = null;

    /**
     * invulnerbale time frame after getting hit
     */
    private iTime: number = 0;

    /**
     * time of immunity after getting hit
     */
    private iDuration: number = 0.5;

    private hitMultiplier: number = 1;

    /**
     * For Jump multipler
     */
    jumpMultiplier: number = 1;

    /**
     * animations
     * note: the player animator is a bit different than other animators since it needs to switch between 3 different 
     * sets of animations based on the current weapon, so we set up the events for all 3 animators and then switch the 
     * active one based on the current weapon. 
     */
    private snowBoardSprite: ImagePath = new ImagePath("res/img/snowboard.png");
    private animator: Animator;

    private rifleAnimator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Idle.png"),
                    frameCount: 7,
                    frameHeight: 128,
                    frameWidth: 128,
                    offestX: 0.25
                },
                AnimationState.IDLE
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Shot_2.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 2
                },
                AnimationState.ATTACK
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Dead.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.DEATH
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Recharge.png"),
                    frameCount: 13,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 1,
                },
                AnimationState.RELOAD
            ],
        ]
    );

    private rpgAnimator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Shot_2.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 2
                },
                AnimationState.ATTACK
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/IdleRPG.png"),
                    frameCount: 7,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.IDLE
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/ReloadRPG.png"),
                    frameCount: 9,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 1,
                },
                AnimationState.RELOAD
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/RPGDead.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.DEATH
            ]
        ]
    );

    private rayGunAnimator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Shot_2.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 2
                },
                AnimationState.ATTACK
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/IdleRay.png"),
                    frameCount: 7,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.IDLE
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/ReloadRay.png"),
                    frameCount: 9,
                    frameHeight: 128,
                    frameWidth: 128,
                    fireOnFrame: 1,
                },
                AnimationState.RELOAD
            ],
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/DeadRay.png"),
                    frameCount: 4,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.DEATH
            ]
        ]
    );

    /**
     * entity component properties
     */
    public tag: string = "player";
    public id: EntityID;

    public velocity: Vec2 = new Vec2();
    public position: Vec2 = new Vec2();
    public physicsCollider = new BoxCollider(2.5, 5.25);
    public sprite: ImagePath = new ImagePath("res/img/player_new.png");
    public removeFromWorld: boolean = false;

    /**
     * player death state
     */
    public dead: boolean = false;

    // players current health and sheild health
    infection: number = 0;
    health: number = 100;
    infectionImmune: boolean = false;

    // players max health (smash bros health system where 0% is min infection)
    minInfection: number = 0;
    maxInfection: number = 200;
    maxHealth: number = 100;

    // Flying cheat
    isFlying: boolean = false;
    private pressFKey: boolean = false;

    // Used in intro animation to not show player
    visible = false;

    // player gun states (player spawns with a gun)
    wantsToReload: boolean = false;
    isReloading: boolean = false;
    isShooting: boolean = false;
    wantsToShoot: boolean = false;

    // for animation locking
    inAnimation: boolean = false;
    endTime: number = 0;
    timer: number = 0;
    /**
     * player gun states (player spawns with assult rifle)
     */
    public weapon: Gun;

    /**
    * whether the shop or armory is open, which disables shooting and movement
    */
    public uiOpen: boolean = false;

    /**
    * The items the player has picked up.
    */
    public items: Item[] = [];

    /**
     * The buffs the player currently has applied.
     */
    public buffs: Buff[] = [];

    /**
     * The amount of currency the player has collected.
     */
    public currency: number = 0;

    constructor(spawnPos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        this.position = new Vec2(spawnPos.x, mountain ? mountain.getHeightAt(spawnPos.x) : spawnPos.y);
        this.weapon = new AssultRifle();

        // create weapons
        this.rifle = new AssultRifle();
        this.rpg = new RPG();
        this.rayGun = new RayGun();
        this.weapon = this.rifle;

        // // add weapons to world
        GameEngine.g_INSTANCE.addUniqueEntity(this.rifle, DrawLayer.of(2));
        GameEngine.g_INSTANCE.addUniqueEntity(this.rpg, DrawLayer.of(2));
        GameEngine.g_INSTANCE.addUniqueEntity(this.rayGun, DrawLayer.of(2));

        // setup player animations
        this.setUpAnimatorEvents(this.rpgAnimator);
        this.setUpAnimatorEvents(this.rifleAnimator);
        this.setUpAnimatorEvents(this.rayGunAnimator);
        this.animator = this.rifleAnimator;

        // sync animation speeds to fire rates and reload times
        this.syncFrames();
    }

    /**
     * syncs the attack and reload animation speed with the current weapons fire rate and reload time.
     * This method must be called after the player changes weapons or when the weapons reload time or fire rate are altered.
     */
    public syncFrames(): void {
        this.animator.synchroizeFrames(this.weapon.fireRate, AnimationState.ATTACK);
        this.animator.synchroizeFrames(1 / this.weapon.reloadTime, AnimationState.RELOAD);
    }

    public update(keys: { [key: string]: boolean }, deltaTime: number, clickCoords: Vec2, mouse: Vec2): void {
        // DEBUG: Force death
        this.debugForceDeath(keys);

        // CHEATS: (Remove later) abilty for player to fly
        this.flyKey(keys);

        if (!this.dead) {
            // ------------- Player health system -------------
            //Todo: refactor health system
            this.iTime -= deltaTime;

            if (!this.isInvulnerable())
                this.hitMultiplier = this.hitMultiplier < 1 ? 1 : this.hitMultiplier - deltaTime / 10; // hit multiplier decays over time, min is 1

            // ------------- Player Buff Timer Logic -------------
            this.updateBuffs(deltaTime);

            // ------------- Player Shooting Logic -------------
            this.updateShooting(mouse);

            // ------------- Player Animation Logic -------------
            this.updateAnimations(deltaTime);

            // ------------ Player Movement Logic -------------
            this.updateMovement(keys, deltaTime);

            // ------------ Snowboard Rotation Logic ----------
            this.updateBoardRotation(deltaTime);

            // ------------- Player Collision Logic -------------
            this.updateCollisions();

        } else {
            this.animator.updateAnimState(AnimationState.DEATH, deltaTime)
        }

        if (this.prevState !== this.currentState) {
            this.onStateChange();
        }
        // console.log(`Player State: ${PlayerState[this.currentState]}.  prev state was: ${PlayerState[this.prevState]}`);
    }

    /**
     * This method changes the players weapon, the players animation,
     * and syncs the new weapons fire rate and reload time to the new animation.
     * 
     * @param newWeaponTag The new weapon tag
     */
    public swapWeapon(newWeaponTag: string): void {
        this.weapon.equipped = false;
        switch (newWeaponTag) {
            case AssultRifle.TAG:
                this.weapon = this.rifle;
                this.animator = this.rifleAnimator;
                this.syncFrames();
                break;
            case RPG.TAG:
                this.weapon = this.rpg;
                this.animator = this.rpgAnimator;
                this.syncFrames();
                break;
            case RayGun.TAG:
                this.weapon = this.rayGun;
                this.animator = this.rayGunAnimator;
                this.syncFrames();
                break;
            default:
                console.log(`Unknown weapon tag: ${this.weapon.tag}`);
        }
        this.weapon.equipped = true;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!this.visible) {
            return;
        }
        this.drawSnowboard(ctx, game);
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }

    /**
     * Draws the snowboard underneath the player, rotated using the dynamically calculated boardRotation.
     */
    public drawSnowboard(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();
        const sprite = game.getSprite(this.snowBoardSprite);

        const player_width_in_world_units = 5;
        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.translate(screenX, screenY - h + 5); // pivot at the sprite’s centre
        ctx.rotate(this.boardRotation);          // align based on jumping/landing logic
        ctx.drawImage(
            sprite,
            -w / 2,
            -h / 2,
            w,
            h
        );
        ctx.restore();
    }


    /**
    * Rewards the player currency for slaughtering zombies
    * @param enemy The zombie killed
    */
    public killedEnemy(enemy: Zombie): void {
        this.currency += enemy.reward;
    }

    /**
     * 
     * @returns True if the player is inside the safeZone; false if otherwise.
     */
    public isInSafeZone(): boolean {
        const mountain: Mountain | undefined = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined;
        if (mountain === undefined) {
            return false;
        }
        const currentSafeZone = mountain.getSafeZoneStatus(this.position.x);
        if (currentSafeZone === null || currentSafeZone.currentZoneIndex === -1) {
            return false;
        }
        return true;
    }

    damagePlayer(damage: number, damageType: DamageType): void {
        if (!G_CONFIG.GOD_MODE) {
            AudioManager.playInstanceSFX(new AudioPath(
                Math.random() > 0.5 ? 'res/aud/sfx/player/damaged.wav'
                    : 'res/aud/sfx/player/damaged2.wav'), 0.3);

            // increase damage based on current health
            // Note: scaled damage is only applied to health, not shield
            const scalingFactor = 1 + (this.infection / 100);
            const ScaledDamage = Math.round(damage * scalingFactor);
            this.hitMultiplier += 0.1; // increase hit multiplier on each hit
            switch (damageType) {
                case "Infection":
                    if (!this.infectionImmune) {
                        this.infection += ScaledDamage;
                        var death = Math.random() * this.infection;
                        //console.log(`health: ${this.health}, death: ${death}, hitMultiplier: ${this.hitMultiplier.toFixed(2)}`);
                        death *= this.hitMultiplier;
                        console.log(`Adjusted death chance: ${death.toFixed(2)}`);

                        if (death >= 170 || this.infection >= this.maxInfection) { // chance of death increases with infection%
                            this.playDeathSFX();
                            //console.log(`Player has died!`);
                            this.dead = true;
                            // hack to force the UI to refresh when the player dies, showing what their infection is at
                            (GameEngine.g_INSTANCE.getUniqueEntityByTag("UI_LAYER") as UILayer).draw(GameEngine.g_INSTANCE['ctx'], GameEngine.g_INSTANCE);

                            // The Check if we need a death screen
                            GameEngine.g_INSTANCE.addUniqueEntity(
                                new DeathScreen(this.position.x, this.position.y, () => {
                                    // in order to reset, refresh windows! 
                                    window.location.reload();
                                }, "infection"),
                                998 as DrawLayer  // just below intro screen layer
                            );
                        }
                    }
                    break;
                case "Health":
                    this.health = Math.max(0, this.health - damage);
                    if (this.health <= 0) {
                        // hack to force the UI to refresh when the player dies, showing what health is at
                        (GameEngine.g_INSTANCE.getUniqueEntityByTag("UI_LAYER") as UILayer).draw(GameEngine.g_INSTANCE['ctx'], GameEngine.g_INSTANCE);
                        this.dead = true;
                        GameEngine.g_INSTANCE.addUniqueEntity(
                            new DeathScreen(this.position.x, this.position.y, () => {
                                // in order to reset, refresh windows! 
                                window.location.reload();
                            }, "ravine"), //TODO FIXME: Should be another kind of death screen for reaching 0 hp
                            998 as DrawLayer  // just below intro screen layer
                        );
                    }
                    break;
            }
        }
    }

    // part of health system, returns true if the player is invulnerable to attack, false otherwise
    private isInvulnerable(): boolean {
        return this.iTime >= 0;
    }

    /**
     * Spawns a bullet 
     */
    private fireWeapon(): void {
        if (!this.queuedShotTarget || this.uiOpen) return;

        const bullet = this.weapon.shoot();

        if (bullet) {
            GameEngine.g_INSTANCE.addEntity(bullet, DrawLayer.of(3));
            //console.log(`Bullet type: ${bullet.constructor.name}`);
        } else {
            console.log(`Bullet is null! Check weapon.shoot() implementation`);
        }
    }

    /**
     * Helper method to update the player's animation state based on their current actions (shooting, reloading, idle).
     */
    private updateAnimations(deltaTime: number): void {
        if (this.weapon.isShooting) {
            // continue playing attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.weapon.wantsToShoot) {
            // start attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.weapon.isReloading) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else if (this.weapon.wantsToReload) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else {
            // Idle animation state
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        }
    }

    /**
     * Helper method to get the mouse coordinates when the player shoots
     */
    private updateShooting(mouse: Vec2): void {
        // Convert incoming DOM client coords -> canvas pixels -> world coords.
        // Do not mutate clickCoords; compute mouseWorldX/Y and use them when spawning bullets.
        let mouseWorldX: number | null = null;
        let mouseWorldY: number | null = null;
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement | null;
        if (canvas && mouse) {
            const rect = canvas.getBoundingClientRect();
            // canvas pixel coords (account for CSS scaling)
            const canvasPxX = (mouse.x - rect.left) * (canvas.width / rect.width);
            const canvasPxY = (mouse.y - rect.top) * (canvas.height / rect.height);

            const meterInPixels = canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            // inverse of: screen = (world - viewport) * meterInPixels / zoom
            mouseWorldX = (canvasPxX * GameEngine.g_INSTANCE.zoom) / meterInPixels + GameEngine.g_INSTANCE.viewportX;
            mouseWorldY = (canvasPxY * GameEngine.g_INSTANCE.zoom) / meterInPixels + GameEngine.g_INSTANCE.viewportY;
        }

        // store the target for when the animation fires
        if (mouseWorldX !== null && mouseWorldY !== null) {
            this.queuedShotTarget = new Vec2(mouseWorldX, mouseWorldY);
        }
    }

    /**
     * Helper method to update the players movement.
     * Based on current input keys, physics, and map area
     */
    private updateMovement(keys: { [key: string]: boolean }, deltaTime: number): void {
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;

        const groundY = mountain.getHeightAt(this.position.x);
        const distToGround = groundY - this.position.y;
        const onGround = distToGround <= 0.2;
        const inSafeZone = this.isInSafeZone();
        this.jumpCooldown = Math.max(0, this.jumpCooldown - deltaTime);

        // == Flying cheat ========================================
        if (this.isFlying) {
            const FLY_SPEED = 150;
            this.velocity.x = 0;
            this.velocity.y = 0;
            if (keys["d"]) this.position.x += FLY_SPEED * deltaTime;
            if (keys["a"]) this.position.x -= FLY_SPEED * deltaTime;
            if (keys["w"] || keys[" "]) this.position.y -= FLY_SPEED * deltaTime;
            if (keys["s"]) this.position.y += FLY_SPEED * deltaTime;
            return; // skip all physics below
        }

        // == Safe-zone walking ====================================
        if (inSafeZone) {
            this.currentState = PlayerState.IDLE;
            const SAFE_ZONE_SPEED = Player.MAX_SPEED * 0.85;
            const SAFE_ZONE_ACCEL = 120;
            if (keys["d"]) this.velocity.x += SAFE_ZONE_ACCEL * deltaTime;
            if (keys["a"]) this.velocity.x -= SAFE_ZONE_ACCEL * deltaTime;

            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;

            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (speed > SAFE_ZONE_SPEED) {
                this.velocity.x = (this.velocity.x / speed) * SAFE_ZONE_SPEED;
                this.velocity.y = (this.velocity.y / speed) * SAFE_ZONE_SPEED;
            }

            // Gravity still applies so the player settles onto the terrain
            this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;

            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            return;
        }

        // == Slope helpers ========================================
        const normal = mountain.getNormalAt(this.position.x);   // unit normal pointing away from slope
        const tangent = new Vec2(normal.y, -normal.x);           // unit tangent along slope
        if (tangent.x < 0) { tangent.x *= -1; tangent.y *= -1; } // ensure rightward / downhill

        if (onGround) {
            // == Project current velocity onto the slope tangent ==
            // This removes any component that would push the player into or away from
            // the slope, preventing the "pogo" / bounce effect entirely.
            const vDotT = this.velocity.x * tangent.x + this.velocity.y * tangent.y;
            this.velocity.x = vDotT * tangent.x;
            this.velocity.y = vDotT * tangent.y;

            // == Slope gravity (accelerate downhill) ==============
            const slopeAccel = GameEngine.g_INSTANCE.G * Player.SLOPE_GRAVITY_MULT;
            this.velocity.x += tangent.x * slopeAccel * deltaTime;
            this.velocity.y += tangent.y * slopeAccel * deltaTime;

            // == Player input =====================================
            if (keys["d"]) {
                this.velocity.x += Player.ACCELERATION * deltaTime;
                this.prevState = this.currentState;
                this.currentState = PlayerState.SLIDING;
            }
            if (keys["a"]) {
                this.velocity.x -= Player.BRAKE_FORCE * deltaTime;
                this.prevState = this.currentState;
                this.currentState = PlayerState.SLIDING;
            }
            if (!keys["a"] && !keys["d"]) {
                this.prevState = this.currentState;
                this.currentState = PlayerState.IDLE;
            }

            // == Jump =============================================
            if (keys["w"] || keys[" "]) {
                // Launch perpendicular to the slope so the jump feels natural on hills
                // horizontal velocity penalty for jumping
                this.velocity.x = this.velocity.x * 0.9
                this.velocity.y += normal.y * Player.JUMP_FORCE * this.jumpMultiplier;
                this.jumpCooldown = 0.2;
                this.prevState = this.currentState;
                this.currentState = PlayerState.JUMPING;
            } else {
                // == Slope-stick: snap position back to terrain ===
                // Only do this when NOT jumping.  This is the core fix: instead of
                // relying on a large stick-force we just move the player to the ground.
                if (this.jumpCooldown <= 0) {
                    this.position.y = groundY;
                    this.prevGroundSpeed = this.velocity.x;
                }
            }

            // == Ground friction ===================================
            this.velocity.x *= (1 - Player.FRICTION);

        } else {
            // == Airborne =========================================
            // Check whether the player should still be on the ground.
            // If the slope dips away beneath them but they're moving slowly,
            // snap them back down (handles gentle concave transitions).
            // Only allow genuine liftoff when fast enough or already rising.
            const speedAlongNormal = this.velocity.x * normal.x + this.velocity.y * normal.y;

            const slopeDroppedAway = distToGround > 0 &&           // ground fell below player
                distToGround < 1.5;           // but only just

            if (slopeDroppedAway && speedAlongNormal < Player.LIFTOFF_THRESHOLD && this.jumpCooldown <= 0) {
                // Stick to the slope: project velocity onto tangent and snap down
                const vDotT = Vec2.dot(this.velocity, tangent);
                this.velocity.x = vDotT * tangent.x;
                this.velocity.y = vDotT * tangent.y;
                this.position.y = groundY;
                this.prevState = this.currentState;
                this.currentState = PlayerState.SLIDING;
            } else {
                // Genuinely airborne
                const AIR_DRAG = 0.9995;
                this.velocity.x *= AIR_DRAG;
                this.prevState = this.currentState;
                this.currentState = PlayerState.AIRBORNE;
            }
        }

        // == Global gravity (always, except flying) ===============
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;

        // == Speed limits =========================================
        if (!inSafeZone) {
            if (onGround) {
                this.velocity.x = Math.max(Player.MIN_SPEED, this.velocity.x);
                this.prevGroundSpeed = this.velocity.x;
            } else {
                this.velocity.x = Math.min(this.velocity.x, this.prevGroundSpeed);
            }
        }
        this.velocity.x = Math.min(Player.MAX_SPEED, this.velocity.x);

        // == Integrate ============================================
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    /**
     * Updates the rotation of the snowboard. It freezes in the air and aligns as the player nears the ground
     */
    private updateBoardRotation(deltaTime: number): void {
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (!mountain) return;

        const groundY = mountain.getHeightAt(this.position.x);
        const distToGround = groundY - this.position.y;

        const normal = mountain.getNormalAt(this.position.x);
        const tan = new Vec2(normal.y, -normal.x);

        // Ensure it points to the right (downhill)
        if (tan.x < 0) {
            tan.x *= -1;
            tan.y *= -1;
        }

        const targetRotation = Math.atan2(tan.y, tan.x);
        const ALIGN_THRESHOLD = 5; // Begins aligning when 5 units above ground

        if (distToGround <= 0.2) {
            // On the ground, it would Snap exactly to the slope
            this.boardRotation = targetRotation;
        } else if (distToGround <= ALIGN_THRESHOLD) {
            // Close to the ground, then smoothly transition to the target angle
            const lerpSpeed = 10;
            this.boardRotation += (targetRotation - this.boardRotation) * Math.min(lerpSpeed * deltaTime, 1);
        }
        // If distToGround > ALIGN_THRESHOLD, do nothing (keeps last known angle)
    }

    /**
     * Helper method to handle player collisions with terrain, items, buffs, spikes, and zombies.
     */
    private updateCollisions(): void {
        // ---------- Collision with safe zone walls ----------
        const safeZoneWalls: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("SafeZoneTurretWall");
        for (const wall of safeZoneWalls) {
            if (this.physicsCollider.collides(this, wall)) {
                this.velocity.x = this.velocity.x * -1;
                this.position.x += this.velocity.x * 0.009;
            }
        }

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain) {
            const groundY = mountain.getHeightAt(this.position.x);
            if (this.position.y > groundY) {
                // Player has clipped into the terrain — push them back out.
                this.position.y = groundY;

                // Project velocity onto the slope so it doesn't abruptly stop
                // and doesn't bounce the player back upward.
                const normal = mountain.getNormalAt(this.position.x);
                const tangent = new Vec2(normal.y, -normal.x);
                if (tangent.x < 0) { tangent.x *= -1; tangent.y *= -1; }

                if (!this.isInSafeZone()) {
                    const vDotT = Vec2.dot(this.velocity, tangent);
                    // Only keep the downhill component (clamp to 0 if somehow moving uphill)
                    const projected = Math.max(0, vDotT);
                    this.velocity.x = projected * tangent.x;
                    this.velocity.y = projected * tangent.y;
                }
            }
        }

        // ---------- Collision with Items ----------
        const items = GameEngine.g_INSTANCE.getEntitiesByTag("ItemEntity") as ItemEntity[];
        for (const itemEnt of items) {
            if (this.physicsCollider.collides(this, itemEnt)) {
                const item: Item = itemEnt.pickup();
                this.items.push(item);

                itemEnt.removeFromWorld = true;
            }
        }

        // ---------- Collision with Buffs ----------
        const buffs = GameEngine.g_INSTANCE.getEntitiesByTag("BuffEntity") as BuffEntity[];
        for (const buffEnt of buffs) {
            if (this.physicsCollider.collides(this, buffEnt)) {
                // no need to apply the buff, it is applied when `pickup` is called.
                const buff: Buff = buffEnt.pickup();
                // We only care about tracking temp buffs.
                if (buff.type === BuffType.TEMP_BUFF) {
                    this.buffs.push(buff);
                }
                buffEnt.removeFromWorld = true;
            }
        }

        const inSafeZone = this.isInSafeZone();
        if (!inSafeZone) {
            // ---------- Collision with spikes ----------
            const spikes: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("spike");
            for (const spikeEntity of spikes) {
                if (this.physicsCollider.collides(this, spikeEntity) && !this.isInvulnerable()) {
                    this.damagePlayer(5, "Health");
                    this.velocity.x = -this.velocity.x * 0.8; // stop player movement on spike hit
                    this.velocity.y = -10; // bounce player up a bit on spike hit
                    this.iTime = this.iDuration; // start invulnerability time
                }
            }

            // ---------- Collision with Zombies ----------
            const zombies: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("BasicZombie");
            for (const zombie of zombies) {
                if (this.physicsCollider.collides(this, zombie) && !this.isInvulnerable() && (zombie as Zombie).health > 0) {
                    this.damagePlayer(2, "Infection");
                    this.iTime = this.iDuration; // start invulnerability time
                }
            }

            // -- Collision with ravines --
            const ravineZones = GameEngine.g_INSTANCE.getEntitiesByTag("RavineDeathZone") as RavineDeathZone[];
            for (const zone of ravineZones) {
                const contact = zone.checkContact(this.position.x, this.position.y);

                // Handles the death when hitting the ravine
                if (contact === "death") {
                    if (!this.dead) {
                        this.playDeathSFX();
                        this.dead = true;
                        GameEngine.g_INSTANCE.addUniqueEntity(
                            new DeathScreen(this.position.x, this.position.y, () => {
                                window.location.reload();
                            }, "ravine"),
                            998 as DrawLayer
                        );
                    }
                    break;
                } else if (contact === "bounce") { // Handling if in ravine, not dead, then bounce 
                    // Figuring out which wall was hit so we know which direction to bounce
                    const wall = zone.getNearestWall(this.position.x);

                    // Handling that bounc
                    if (wall === "left") {
                        // if hit the left wall then bounce to the right and push player away from the wall
                        this.velocity.x = Math.abs(this.velocity.x) * 0.6;
                        this.position.x = zone.leftWallX + 1.5; // nudge away from wall
                    } else {
                        // if hit the right wall then bounce to the left and push player away from the wall
                        this.velocity.x = -Math.abs(this.velocity.x) * 0.6;
                        this.position.x = zone.rightWallX - 1.5; // nudge away from wall
                    }

                    // Ensures that the player is being bounch downward to death zones
                    this.velocity.y = Math.abs(this.velocity.y) * 0.8 + 5;

                    break;
                }
            }
        }
    }

    /**
     *  Helper method to update the player's buffs
     */
    private updateBuffs(deltaTime: number): void {
        // Decrease timer for our temp buffs
        for (const buff of
            this.buffs.filter(
                (item) => item.type === BuffType.TEMP_BUFF
            ) as (Buff & TempBuff)[]
        ) {
            buff.currentDuration = buff.currentDuration - deltaTime;
            if (buff.currentDuration <= 0) {
                this.buffs.splice(this.buffs.indexOf(buff), 1);
            }
        }
        // infection drops off over time
        this.infection = clamp(this.infection - 0.01, 0, this.infection);
    }

    /**
     * Helper method to set up animation events
     * 
     * @param animator The player animation
     */
    private setUpAnimatorEvents(animator: Animator): void {

        animator.onEvent(AnimationEvent.ATTACK_FIRE, () => {
            this.fireWeapon();
            //console.log(`Attack animation fired`);
        });

        animator.onEvent(AnimationEvent.ATTACK_END, () => {
            this.weapon.isShooting = false;
            //console.log(`Attack animation ended`);
        });

        animator.onEvent(AnimationEvent.RELOAD_START, () => {
            this.weapon.playReloadSFX();
        });

        animator.onEvent(AnimationEvent.RELOAD_END, () => {
            this.weapon.isReloading = false;
            this.weapon.reload();
        });
    }

    /**
     * TEMP METHOD: USE to immedite debug and look at the death animation 
     */
    debugForceDeath(keys: { [key: string]: boolean }) {
        if (keys["k"] && G_CONFIG.ENABLE_DEBUG_KEYS) {
            this.dead = true;
            GameEngine.g_INSTANCE.addUniqueEntity(
                new DeathScreen(this.position.x, this.position.y, () => {
                    window.location.reload();
                }),
                998 as DrawLayer
            );
        }

    }

    /**
     * Method when press F, it allows us to fly
     * WILL DEELTE LATER, DEBUG since its a pain to die
     */
    flyKey(keys: { [key: string]: boolean }) {
        if (keys["f"] && !this.pressFKey && G_CONFIG.ENABLE_DEBUG_KEYS) {
            this.isFlying = !this.isFlying;
        }
        this.pressFKey = keys["f"];
    }

    /**
     * plays SFX for the players state
     */
    private onStateChange(): void {
        if (this.prevState === PlayerState.AIRBORNE && this.currentState === PlayerState.SLIDING) {
            AudioManager.playSFX(new AudioPath('res/aud/sfx/player/land.wav'), 0.5);
        }

        if (this.currentState === PlayerState.SLIDING) {
            AudioManager.playLoopingSFX(new AudioPath('res/aud/sfx/player/snowboard.wav'), 1);
            console.log("Started sliding - play snowboard sound");
        } else {
            AudioManager.stopLoopingSFX(new AudioPath('res/aud/sfx/player/snowboard.wav'));
        }
    }

    private playDeathSFX(): void {
        AudioManager.stopMusic(new AudioPath("res/aud/music/game_music.ogg"));
        AudioManager.playSFX(new AudioPath("res/aud/sfx/player/death.wav"), 0.5);
    }
}
