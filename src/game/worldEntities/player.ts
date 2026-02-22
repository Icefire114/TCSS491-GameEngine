import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { DrawLayer, Vec2 } from "../../engine/types.js";
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
import { RayGun } from "../Items/guns/RayGun.js";

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
    static GROUND_STICK_FORCE = 500;
    static JUMP_FORCE = -35;
    static SLOPE_GRAVITY_MULT = 1.2;

    private prevGroundSpeed: number = 0;

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
    private jumpMultiplier: number = 1;

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
                },
                AnimationState.RELOAD
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
                },
                AnimationState.RELOAD
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
    public health: number = 0;
    public shield: number = 100;

    // players max health (smash bros health system where 0% is max health)
    public maxHealth: number = 0;
    public maxShield: number = 100;

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

    /**
     * Constructor for the player. 
     */
    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;

        // create weapons
        this.rifle = new AssultRifle();
        this.rpg = new RPG();
        this.rayGun = new RayGun();
        this.weapon = this.rifle;

        // add weapons to world
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
        this.animator.synchroizeFrames(1/this.weapon.reloadTime, AnimationState.RELOAD);
    }

    public update(keys: { [key: string]: boolean }, deltaTime: number, clickCoords: Vec2, mouse: Vec2): void {
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

            // ------------- Player Collision Logic -------------
            this.updateCollisions();

        } else {
            this.animator.updateAnimState(AnimationState.DEATH, deltaTime)
        }
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

    // TODO(pg): When we are going down a slope, we should rotate the snowboard to be perpendicular to the slope
    //            and maybe shear the player's sprite to match it aswell?

    public draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.drawSnowboard(ctx, game);
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }

    /**
     * Draws the snowboard underneath the player, rotated to match the slope of the mountain. 
     */
    public drawSnowboard(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();
        const mountain: Mountain = game.getUniqueEntityByTag("mountain") as Mountain;
        const sprite = game.getSprite(this.snowBoardSprite);

        const player_width_in_world_units = 5;
        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        const normal: Vec2 = mountain.getNormalAt(this.position.x);
        const tan = new Vec2(normal.y, -normal.x);

        // Ensure it points to the right (downhill)
        if (tan.x < 0) {
            tan.x *= -1;
            tan.y *= -1;
        }

        // Angle in radians
        const rotation = Math.atan2(tan.y, tan.x);

        ctx.translate(screenX, screenY - h + 5); // pivot at the sprite’s centre
        ctx.rotate(rotation);                    // align +x with the tangent
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

    // Todo: change the health system
    private damagePlayer(damage: number): void {
        if (!G_CONFIG.GOD_MODE) {
            // increase damage based on current health
            // Note: scaled damage is only applied to health, not shield
            const scalingFactor = 1 + (this.health / 100);
            const ScaledDamage = Math.round(damage * scalingFactor);
            this.hitMultiplier += 0.1; // increase hit multiplier on each hit

            if (this.shield <= 0) { //damage shield first
                this.health += ScaledDamage;
                var death = Math.random() * this.health;
                //console.log(`health: ${this.health}, death: ${death}, hitMultiplier: ${this.hitMultiplier.toFixed(2)}`);
                death *= this.hitMultiplier;
                console.log(`Adjusted death chance: ${death.toFixed(2)}`);

                if (death >= 150) { // chance of death increases with health%
                    //console.log(`Player has died!`);
                    this.dead = true;
                }

            } else {
                this.shield = Math.max(0, this.shield - damage);
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
        const onGround: boolean = Math.abs(this.position.y - mountain.getHeightAt(this.position.x)) <= 0.2;
        const inSafeZone = this.isInSafeZone();
        if (inSafeZone) {
            // Reset velocity when entering safe zone to avoid carrying momentum
            const SAFE_ZONE_SPEED = Player.MAX_SPEED * 0.85;
            const SAFE_ZONE_ACCEL = 120;

            // Horizontal movement
            if (keys["d"]) {
                this.velocity.x += SAFE_ZONE_ACCEL * deltaTime;
            }
            if (keys["a"]) {
                this.velocity.x -= SAFE_ZONE_ACCEL * deltaTime;
            }

            // Apply friction to slow down when no keys pressed
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;

            // Clamp speed
            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (speed > SAFE_ZONE_SPEED) {
                this.velocity.x = (this.velocity.x / speed) * SAFE_ZONE_SPEED;
                this.velocity.y = (this.velocity.y / speed) * SAFE_ZONE_SPEED;
            }
        } else {
            // ---------- Ground-only momentum ----------
            if (onGround) {
                // --- Slope-based gravity ---
                const normal = mountain.getNormalAt(this.position.x);

                // Tangent parallel to slope
                const tangent = new Vec2(normal.y, -normal.x);

                // Ensure downhill (rightward)
                if (tangent.x < 0) {
                    tangent.x *= -1;
                    tangent.y *= -1;
                }

                // Project gravity along slope
                const slopeAccel = GameEngine.g_INSTANCE.G * Player.SLOPE_GRAVITY_MULT;
                this.velocity.x += tangent.x * slopeAccel * deltaTime;
                this.velocity.y += tangent.y * slopeAccel * deltaTime;

                // --- Player input (ground only) ---
                if (keys["d"]) {
                    this.velocity.x += Player.ACCELERATION * deltaTime;
                }

                if (keys["a"]) {
                    this.velocity.x -= Player.BRAKE_FORCE * deltaTime;
                }
                // ---------- Jump ----------
                if ((keys["w"] || keys[" "]) && onGround) {
                    this.velocity.y = Player.JUMP_FORCE * this.jumpMultiplier;
                }

                // Stick player to terrain
                this.velocity.y += Player.GROUND_STICK_FORCE * deltaTime;
            } else {
                // ---------- In air: no momentum gains ----------
                const AIR_DRAG = 0.9995;
                this.velocity.x *= AIR_DRAG;
            }
        }


        // ---------- Gravity ----------
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;

        // ---------- Ground friction ----------
        if (onGround) {
            this.velocity.x *= (1 - Player.FRICTION);
        }


        // ---------- Speed limits ----------
        if (!inSafeZone) {
            if (onGround) {
                this.velocity.x = Math.max(Player.MIN_SPEED, this.velocity.x);
                this.prevGroundSpeed = this.velocity.x;
            } else {
                this.velocity.x = Math.min(this.velocity.x, this.prevGroundSpeed);
            }
        }

        this.velocity.x = Math.min(Player.MAX_SPEED, this.velocity.x);

         // ---------- Integrate ----------
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
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
            }
        }

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.velocity.y = 0;
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
                    this.damagePlayer(5);
                    this.velocity.x = -this.velocity.x * 0.8; // stop player movement on spike hit
                    this.velocity.y = -10; // bounce player up a bit on spike hit
                    this.iTime = this.iDuration; // start invulnerability time
                }
            }

            // ---------- Collision with Zombies ----------
            const zombies: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("BasicZombie");
            for (const zombie of zombies) {
                if (this.physicsCollider.collides(this, zombie) && !this.isInvulnerable()) {
                    this.damagePlayer(10);
                    this.iTime = this.iDuration; // start invulnerability time
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

        animator.onEvent(AnimationEvent.RELOAD_END, () => {
            this.weapon.isReloading = false;
            this.weapon.reload();
        });
    }
}
