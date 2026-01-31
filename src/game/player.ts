import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";
import { Item, ItemType, TempBuff } from "./Items/Item.js";
import { ItemEntity } from "./Items/ItemEntity.js";
import { Collidable } from "../engine/physics/Collider.js";
import { Mountain } from "./mountain.js";
import { AnimationState, Animator } from "../engine/Animator.js";

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity, Collidable {
    tag: string = "player";
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(2, 4);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;

    snowBoardSprite: ImagePath = new ImagePath("res/img/snowboard.png");
    animator: Animator = new Animator(
        [
            [
                {
                    sprite: new ImagePath("res/img/soldiers/Soldier_1/Idle.png"),
                    frameCount: 7,
                    frameHeight: 128,
                    frameWidth: 128,
                    offestX: -5
                },
                AnimationState.IDLE
            ]
        ]
    );

    prevGroundSpeed: number = 0;

    // Movement tuning constants
    MIN_SPEED = 15;
    MAX_SPEED = 350;
    SLIDE_FORCE = 50;
    ACCELERATION = 60;
    BRAKE_FORCE = 200;
    FRICTION = 0.01;
    GROUND_STICK_FORCE = 500;
    JUMP_FORCE = -30;

    isInSafeZone(): boolean {
        // TODO(pg): If in terrain flat zone, then its a safe zone.
        return false;
    }

    // players current health and sheild health
    health: number = 0;
    shield: number = 100;

    // players max health (smash bros health system where 0% is max health)
    maxHealth: number = 0;
    maxSheild: number = 100;

    // invulnerbale time frame after getting hit
    iTime: number = 0;
    // time of immunity after getting hit
    iDuration: number = 0.5;

    hitMultiplier: number = 1;

    // god mode for testing
    godMode: boolean = false;

    /**
     * The items the player has picked up.
     */
    items: Item[] = [];

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }


    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        //console.log(`Player position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})`);
        //console.log(`Player IWindow: ${this.iTime.toFixed(2)}`);
        console.log(`deltaTime: ${deltaTime / 10}`);
        this.iTime -= deltaTime;

        if (!this.isInvulnerable())
            this.hitMultiplier = this.hitMultiplier < 1 ? 1 : this.hitMultiplier - deltaTime / 10; // hit multiplier decays over time, min is 1

        for (const item of
            this.items.filter(
                (item) => item.type === ItemType.TEMP_BUFF
            ) as (Item & TempBuff)[]
        ) {
            item.currentDuration = item.currentDuration - deltaTime;
            if (item.currentDuration <= 0) {
                this.items.splice(this.items.indexOf(item), 1);
            }
        }


        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        const onGround = this.velocity.y === 0; // TODO: fix later, dist between player and ground < some threshold?

        // ---------- Ground-only momentum ----------
        if (onGround) {
            // Base downhill slide (only if not in a safe zone)
            if (!this.isInSafeZone()) {
                this.velocity.x += this.SLIDE_FORCE * deltaTime;
            }

            // D key: Speed up
            if (keys["d"]) {
                this.velocity.x += this.ACCELERATION * deltaTime;
            }

            // A key: Brake
            if (keys["a"]) {
                this.velocity.x -= this.BRAKE_FORCE * deltaTime;
            }

            // Stick to ground
            this.velocity.y += this.GROUND_STICK_FORCE * deltaTime;

            // Convert some gravity into forward motion (slope feel)
            const GRAVITY_TO_FORWARD = 0.4;
            this.velocity.x += GameEngine.g_INSTANCE.G * GRAVITY_TO_FORWARD * deltaTime;
        } else {
            // ---------- In air: no momentum gains ----------
            // Optional small air drag to prevent creeping speed increases
            const AIR_DRAG = 0.9995;
            this.velocity.x *= AIR_DRAG;
        }

        // ---------- Jump (ground only) ----------
        if ((keys["w"] || keys[" "]) && onGround) {
            this.velocity.y = this.JUMP_FORCE;
        }

        // ---------- Gravity ----------
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;

        // ---------- Ground friction only ----------
        if (onGround) {
            this.velocity.x *= (1 - this.FRICTION);
        }

        // ---------- Enforce right-only + min/max speed ----------
        if (onGround) {
            this.velocity.x = Math.max(this.MIN_SPEED, this.velocity.x);
        } else {
            // In air: never allow speed to increase
            this.velocity.x = Math.min(this.velocity.x, this.prevGroundSpeed ?? this.velocity.x);
        }

        this.velocity.x = Math.min(this.MAX_SPEED, this.velocity.x);

        // Store last grounded speed
        if (onGround) {
            this.prevGroundSpeed = this.velocity.x;
        }

        // ---------- Integrate ----------
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.velocity.y = 0;
            }
        }

        // -- Collision with items --
        const items = GameEngine.g_INSTANCE.getEntitiesByTag("ItemEntity") as ItemEntity[];
        for (const itemEnt of items) {
            if (this.physicsCollider.collides(this, itemEnt)) {
                console.log(`We hit item ${itemEnt.id}`);
                this.items.push(itemEnt.pickup());
                itemEnt.removeFromWorld = true;
            }
        }

        // -- Collision with spikes --
        const spike: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("spike");
        for (const spikeEntity of spike) {
            if (this.physicsCollider.collides(this, spikeEntity) && !this.isInvulnerable()) {
                console.log(`Player hit a spike!`);
                this.damagePlayer(5);
                this.velocity.x = -this.velocity.x * 0.8; // stop player movement on spike hit
                this.velocity.y = -10; // bounce player up a bit on spike hit
                this.iTime = this.iDuration; // start invulnerability time
                console.log('Player hit a spike');
            }
        }

        // -- Collision with zombies --
        const zombies: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag("BasicZombie");
        for (const zombie of zombies) {
            if (this.physicsCollider.collides(this, zombie) && !this.isInvulnerable()) {
                this.damagePlayer(10);
                this.iTime = this.iDuration; // start invulnerability time
                console.log(`Player hit by a zombie`);
            }
        }
    }


    // TODO(pg): When we are going down a slope, we should rotate the snowboard to be perpendicular to the slope
    //            and maybe shear the player's sprite to match it aswell?

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.drawSnowboard(ctx, game);
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    drawSnowboard(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.snowBoardSprite);

        const player_width_in_world_units = 5;
        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.drawImage(
            sprite,
            screenX - w / 4,
            screenY - h + 10,
            w,
            h
        )
    }

    damagePlayer(damage: number): void {
        if (!this.godMode) {
            // increase damage based on current health
            // Note: scaled damage is only applied to health, not shield
            const scalingFactor = 1 + (this.health / 100);
            const ScaledDamage = Math.round(damage * scalingFactor);
            this.hitMultiplier += 0.1; // increase hit multiplier on each hit

            if (this.shield <= 0) { //damage shield first
                this.health += ScaledDamage;
                var death = Math.random() * this.health;
                console.log(`health: ${this.health}, death: ${death}, hitMultiplier: ${this.hitMultiplier.toFixed(2)}`);
                death *= this.hitMultiplier;
                console.log(`Adjusted death chance: ${death.toFixed(2)}`);

                if (death >= 150) { // chance of death increases with health%
                    console.log(`Player has died!`);
                    this.removeFromWorld = true;
                }

            } else {
                this.shield = Math.max(0, this.shield - damage);
            }
        }
    }

    isInvulnerable(): boolean {
        return this.iTime >= 0;
    }
}
