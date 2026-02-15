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
import { RifleBullet } from "./bullets/RifleBullet.js";
import { G_CONFIG } from "../CONSTANTS.js";
import { Buff, BuffType, TempBuff } from "../Items/Buff.js";
import { BuffEntity } from "../Items/BuffEntity.js";
import { Zombie } from "../zombies/Zombie.js";
import { RPGRocket } from "./bullets/RPGRocket.js";
import { LazerBullet } from "./bullets/LazerBullet.js";
import { Gun } from "../Items/guns/Gun.js";
import { AssultRifle } from "../Items/guns/AssultRifle.js";
import { RPG } from "../Items/guns/RPG.js";

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity, Collidable {
    tag: string = "player";
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(2.5, 6.5);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;
    dead: boolean = false;

    snowBoardSprite: ImagePath = new ImagePath("res/img/snowboard.png");
    animator: Animator;
    
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
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Recharge.png"),
                    frameCount: 1,
                    frameHeight: 128,
                    frameWidth: 128,
                },
                AnimationState.RELOAD
            ]
        ]
    );

    prevGroundSpeed: number = 0;

    // Movement tuning constants
    MIN_SPEED = 15;
    MAX_SPEED = 150;
    SLIDE_FORCE = 50;
    ACCELERATION = 60;
    BRAKE_FORCE = 200;
    FRICTION = 0.01;
    GROUND_STICK_FORCE = 500;
    JUMP_FORCE = -25;
    SLOPE_GRAVITY_MULT = 1.2;

    isInSafeZone(): boolean {
        // TODO(pg): If in terrain flat zone, then its a safe zone.
        return false;
    }

    // players current health and sheild health
    health: number = 0;
    shield: number = 100;

    // players max health (smash bros health system where 0% is max health)
    maxHealth: number = 0;
    maxShield: number = 100;

    // invulnerbale time frame after getting hit
    iTime: number = 0;
    // time of immunity after getting hit
    iDuration: number = 0.5;

    hitMultiplier: number = 1;

    // player gun states (player spawns with a gun)
    weapon: Gun;
    wantsToReload: boolean = false;
    isReloading: boolean = false;
    isShooting: boolean = false;
    wantsToShoot: boolean = false;
    queuedShotTarget: Vec2 | null = null;

    // for animation locking
    inAnimation: boolean = false;
    endTime: number = 0;
    timer: number = 0;

    /**
     * The items the player has picked up.
     */
    items: Item[] = [];

    /**
     * The buffs the player currently has applied.
     */
    buffs: Buff[] = [];

    /**
     * The amount of currency the player has collected.
     */
    currency: number = 0;

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        //this.weapon = new AssultRifle(this.position);
        this.weapon = new RPG(this.position);
        GameEngine.g_INSTANCE.addEntity(this.weapon, DrawLayer.of(2));
        
        this.setUpAnimatorEvents(this.rpgAnimator);
        this.setUpAnimatorEvents(this.rifleAnimator);

        this.animator = this.rpgAnimator;

        this.synchroizeAttackFrames();
    }

    private setUpAnimatorEvents(animator: Animator): void {

        animator.onEvent(AnimationEvent.ATTACK_FIRE, () => {
            this.fireWeapon();
            console.log(`Attack animation fired`);
        });

        animator.onEvent(AnimationEvent.ATTACK_END, () => {
            this.isShooting = false;
            this.weapon.isShooting = false;
            // if (this.wantsToShoot) 
            //     this.animator.updateAnimState(AnimationState.IDLE, 0); 
            console.log(`Attack animation ended`);
        });

        animator.onEvent(AnimationEvent.RELOAD_END, () => {
            this.isReloading = false;
            this.weapon.isReloading = false;
            this.weapon.reload();
        });
    }

    synchroizeAttackFrames(): void {
        // Get the attack animation info
        const attackAnimInfo = this.animator['spriteSheet'][AnimationState.ATTACK];
        if (!attackAnimInfo) return;
        
        // Calculate desired animation duration based on fire rate
        const shotCooldownSeconds = this.weapon.getShotCooldown() / 1000; // convert ms to seconds
        
        // Calculate how long the animation naturally takes at base speed
        const baseAnimDuration = attackAnimInfo.frameCount / this.animator['ANIMATION_FPS'];
        
        // Calculate speed multiplier needed
        const speedMultiplier = baseAnimDuration / shotCooldownSeconds;
        
        // Update the animation speed
        attackAnimInfo.animationSpeed = speedMultiplier;
        
        console.log(`Synced animation: Fire rate=${this.weapon.fireRate}/s, Cooldown=${shotCooldownSeconds}s, Speed multiplier=${speedMultiplier.toFixed(2)}x`);
    }


    update(keys: { [key: string]: boolean }, deltaTime: number, clickCoords: Vec2): void {
        // Convert incoming DOM client coords -> canvas pixels -> world coords.
        // Do not mutate clickCoords; compute mouseWorldX/Y and use them when spawning bullets.
        let mouseWorldX: number | null = null;
        let mouseWorldY: number | null = null;
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement | null;
        if (canvas && clickCoords) {
            const rect = canvas.getBoundingClientRect();
            // canvas pixel coords (account for CSS scaling)
            const canvasPxX = (clickCoords.x - rect.left) * (canvas.width / rect.width);
            const canvasPxY = (clickCoords.y - rect.top) * (canvas.height / rect.height);

            const meterInPixels = canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            // inverse of: screen = (world - viewport) * meterInPixels / zoom
            mouseWorldX = (canvasPxX * GameEngine.g_INSTANCE.zoom) / meterInPixels + GameEngine.g_INSTANCE.viewportX;
            mouseWorldY = (canvasPxY * GameEngine.g_INSTANCE.zoom) / meterInPixels + GameEngine.g_INSTANCE.viewportY;
        }


        if (!this.dead) {
            this.iTime -= deltaTime;

            if (!this.isInvulnerable())
                this.hitMultiplier = this.hitMultiplier < 1 ? 1 : this.hitMultiplier - deltaTime / 10; // hit multiplier decays over time, min is 1

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

            // store the target for when the animation fires
            if (mouseWorldX !== null && mouseWorldY !== null) {
                this.queuedShotTarget = new Vec2(mouseWorldX, mouseWorldY);
            }

            const currentTime = Date.now();
            this.wantsToShoot = keys["Mouse0"] && this.weapon.canShoot(currentTime);
            this.weapon.wantsToShoot = this.wantsToShoot;
            this.wantsToReload = keys["r"] && this.weapon.canReload();
            this.weapon.wantsToReload = this.wantsToReload;

            // ---------- Animation Logic ----------
            if (this.isShooting) {
                // continue playing attack animation
                this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
            } else if (this.wantsToShoot) {
                // start attack animation
                this.isShooting = true;
                this.weapon.isShooting = true;
                this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
            } else if (this.isReloading) {
                this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
            } else if (this.wantsToReload) {
                this.isReloading = true;
                this.weapon.isReloading = true;
                this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
            } else {
                // Idle animation state
                this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
            }



            const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
            const onGround: boolean = Math.abs(this.position.y - mountain.getHeightAt(this.position.x)) <= 0.2;
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
                const slopeAccel = GameEngine.g_INSTANCE.G * this.SLOPE_GRAVITY_MULT;
                this.velocity.x += tangent.x * slopeAccel * deltaTime;
                this.velocity.y += tangent.y * slopeAccel * deltaTime;

                // --- Player input (ground only) ---
                if (!this.isInSafeZone() && keys["d"]) {
                    this.velocity.x += this.ACCELERATION * deltaTime;
                }

                if (keys["a"]) {
                    this.velocity.x -= this.BRAKE_FORCE * deltaTime;
                }

                // Stick player to terrain
                this.velocity.y += this.GROUND_STICK_FORCE * deltaTime;
            } else {
                // ---------- In air: no momentum gains ----------
                const AIR_DRAG = 0.9995;
                this.velocity.x *= AIR_DRAG;
            }

            // ---------- Jump ----------
            if ((keys["w"] || keys[" "]) && onGround) {
                this.velocity.y = this.JUMP_FORCE;
            }

            // ---------- Gravity ----------
            this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;

            // ---------- Ground friction ----------
            if (onGround) {
                this.velocity.x *= (1 - this.FRICTION);
            }

            // ---------- Speed limits ----------
            if (onGround) {
                this.velocity.x = Math.max(this.MIN_SPEED, this.velocity.x);
                this.prevGroundSpeed = this.velocity.x;
            } else {
                this.velocity.x = Math.min(this.velocity.x, this.prevGroundSpeed);
            }

            this.velocity.x = Math.min(this.MAX_SPEED, this.velocity.x);

            // ---------- Integrate ----------
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;

            // ---------- Integrate ----------
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;

            // ---------- Collision with terrain ----------
            if (mountain && mountain.physicsCollider) {
                if (this.physicsCollider.collides(this, mountain)) {
                    this.velocity.y = 0;
                }
            }

            // -- Collision with items --
            const items = GameEngine.g_INSTANCE.getEntitiesByTag("ItemEntity") as ItemEntity[];
            for (const itemEnt of items) {
                if (this.physicsCollider.collides(this, itemEnt)) {
                    //console.log(`We hit item ${itemEnt.id}`);
                    const item: Item = itemEnt.pickup();
                    this.items.push(item);

                    itemEnt.removeFromWorld = true;
                }
            }

            // -- Collision with buffs --
            const buffs = GameEngine.g_INSTANCE.getEntitiesByTag("BuffEntity") as BuffEntity[];
            for (const buffEnt of buffs) {
                if (this.physicsCollider.collides(this, buffEnt)) {
                    //console.log(`We hit buff ${buffEnt.id}`);
                    // no need to apply the buff, it is applied when `pickup` is called.
                    const buff: Buff = buffEnt.pickup();
                    // We only care about tracking temp buffs.
                    if (buff.type === BuffType.TEMP_BUFF) {
                        this.buffs.push(buff);
                    }
                    buffEnt.removeFromWorld = true;
                }
            }

            // -- Collision with spikes --
            const spike: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("spike");
            for (const spikeEntity of spike) {
                if (this.physicsCollider.collides(this, spikeEntity) && !this.isInvulnerable()) {
                    //console.log(`Player hit a spike!`);
                    this.damagePlayer(5);
                    this.velocity.x = -this.velocity.x * 0.8; // stop player movement on spike hit
                    this.velocity.y = -10; // bounce player up a bit on spike hit
                    this.iTime = this.iDuration; // start invulnerability time
                    //console.log('Player hit a spike');
                }
            }

            // -- Collision with zombies --
            const zombies: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("BasicZombie");
            for (const zombie of zombies) {
                if (this.physicsCollider.collides(this, zombie) && !this.isInvulnerable()) {
                    this.damagePlayer(10);
                    this.iTime = this.iDuration; // start invulnerability time
                    //console.log(`Player hit by a zombie`);
                }
            }
        } else {
            this.animator.updateAnimState(AnimationState.DEATH, deltaTime)
        }

    }

    fireWeapon(): void {
            console.log(`queuedTarget: ${this.queuedShotTarget}, wantsToShoot: ${this.wantsToShoot}`);

        if (!this.queuedShotTarget || !this.wantsToShoot) {
            console.log(`skipping fireWeapon.`);
            return;
        }

        const currentTime = Date.now();
        const bullet = this.weapon.shoot(this.position.x, this.position.y, this.queuedShotTarget.x, this.queuedShotTarget.y, currentTime);

        console.log(`${bullet ? "Shot fired" : "Failed to fire"} at (${this.queuedShotTarget.x.toFixed(2)}, ${this.queuedShotTarget.y.toFixed(2)}) with weapon ${this.weapon.tag}`);

        if (bullet) {
            console.log(`Bullet type: ${bullet.constructor.name}`);
            GameEngine.g_INSTANCE.addEntity(bullet, DrawLayer.of(3));
            console.log(`Fired weapon, ammo left in gun: ${this.weapon.ammoInGun}`);
        } else {
                    console.log(`Bullet is null! Check weapon.shoot() implementation`);

        }
    }


    // TODO(pg): When we are going down a slope, we should rotate the snowboard to be perpendicular to the slope
    //            and maybe shear the player's sprite to match it aswell?

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.drawSnowboard(ctx, game);
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    drawSnowboard(ctx: CanvasRenderingContext2D, game: GameEngine): void {
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

    damagePlayer(damage: number): void {
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

    isInvulnerable(): boolean {
        return this.iTime >= 0;
    }

    killedEnemy(enemy: Zombie): void {
            this.currency += enemy.reward;
    }
}
