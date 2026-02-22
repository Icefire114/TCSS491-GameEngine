import { AnimationState } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Vec2 } from "../../../engine/types.js";
import { unwrap } from "../../../engine/util.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { Player } from "../../worldEntities/player.js";

export abstract class Gun implements Entity {

    /**
     * Offset for position
     */
    readonly SHOULDER_OFFSET_X: number = -0.7;
    readonly SHOULDER_OFFSET_Y: number = -3.8;

    /**
     * Angle at which the gun is facing/traveling.
     */
    protected travelAngle = 0;

    /**
     * abstract properties that all guns must have
     */
    abstract sprite: ImagePath;
    abstract animator: any;
    abstract equipped: boolean;
    abstract unlocked: boolean;
    abstract ammoBox: number; // how much ammo this gun refills to when picking up an ammo restore item

    /**
     * Entity properties
     */
    public tag: string;
    public id: EntityID;
    public velocity: Vec2 = new Vec2();
    public position: Vec2 = new Vec2();
    public physicsCollider = null;
    public removeFromWorld: boolean = false;
    
    /**
     * Gun-specific properties
     */
    public ammoOnHand: number; // total ammo the player has for this gun (not including what's currently loaded)
    public ammoInGun: number; // current ammo in the gun
    public magSize: number;
    public fireRate: number; // in shots per second
    public reloadTime: number; // in seconds

    public wantsToShoot: boolean = false;
    public wantsToReload: boolean = false;
    public isShooting: boolean = false;
    public isReloading: boolean = false;

    /**
     * abstract methods to create bullets and sync animations
     */
    protected abstract createBullet(): Bullet;
    public abstract syncFrames(): void;


    constructor(tag: string, ammo: number, magSize: number, fireRate: number, reloadTime: number) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;

        this.magSize = magSize;
        this.ammoInGun = magSize;
        this.ammoOnHand = ammo;
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;
    }

    /**
     * Call when the player shoots 
     * @returns A projectile
     */
    public shoot(): Bullet | null {
        if (!this.canShoot()) {
            return null;
        }

        this.ammoInGun--;
        return this.createBullet();
    }

    /**
     * Call when the player reloads
     */
    public reload(): void {
        if (!this.canReload()) return;
        
            const ammoToReload = this.magSize - this.ammoInGun;
            if (this.ammoOnHand >= ammoToReload) {
                this.ammoInGun = this.magSize;
                this.ammoOnHand -= ammoToReload;
            } else {
                this.ammoInGun += this.ammoOnHand;
                this.ammoOnHand = 0;
            }
            this.isReloading = false;
        
    }

    /**
     * Draw the gun. Gun should only be drawn if it's currently equipped by the player.
     */
    public draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!this.equipped) return;

        ctx.save();

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;
        
        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);

        this.animator.drawCurrentAnimFrameAtOrigin(ctx, 0.3, 0.5);

        ctx.restore();
    }

    public update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2, mouse: Vec2): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;
        const shoulderX = player.position.x + this.SHOULDER_OFFSET_X;
        const shoulderY = player.position.y + this.SHOULDER_OFFSET_Y;
        

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

            if (mouseWorldX !== null && mouseWorldY !== null) {
                const dx = mouseWorldX - shoulderX;
                const dy = mouseWorldY - shoulderY;
                this.travelAngle = Math.atan2(dy, dx);
            }

            this.position.x = shoulderX + Math.cos(this.travelAngle);
            this.position.y = shoulderY + Math.sin(this.travelAngle);
        }

        if (!player.uiOpen) {
            this.wantsToShoot = keys["Mouse0"] && this.canShoot();
            this.wantsToReload = keys["r"] && this.canReload();
        } else {
            this.wantsToShoot = false;
            this.wantsToReload = false;
            this.isShooting = false;
        }
        
        // ---------- Animation Logic ----------
        if (this.isShooting) {
            // continue playing attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.wantsToShoot) {
            // start attack animation
            this.isShooting = true;
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.isReloading) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else if (this.wantsToReload) {
            this.isReloading = true;
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else {
            // Idle animation state
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        }
    }

    /**
     * 
     * @returns true if the player can shoot; false if otherwise
     */
    private canShoot(): boolean {
        if (this.isReloading) return false;
        if (this.ammoInGun <= 0) return false;

        return !this.isReloading && this.ammoInGun > 0;
    }

    /**
     * 
     * @returns true if the player can reload; false if otherwise
     */
    private canReload(): boolean {
        return !this.isReloading && this.ammoInGun < this.magSize && this.ammoOnHand > 0;
    }
}