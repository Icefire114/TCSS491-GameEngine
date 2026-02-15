import { AnimationState } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Collider } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/types.js";
import { unwrap } from "../../../engine/util.js";
import { Bullet } from "../../worldEntities/bullets/Bullet.js";
import { Player } from "../../worldEntities/player.js";

export abstract class Gun implements Entity {

    private readonly DEFAULT_XOFFSET: number = -1;
    private readonly DEFAULT_YOFFSET: number = 5.5;
    private readonly GUN_LENGTH: number = 1;
    protected travelAngle = 0;

    tag: string;
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = null;
    abstract sprite: ImagePath;
    removeFromWorld: boolean = false;
    abstract animator: any;


    ammoOnHand: number; // total ammo the player has for this gun (not including what's currently loaded)
    ammoInGun: number; // current ammo in the gun
    magSize: number;
    fireRate: number; // in shots per second
    lastShotTime: number = 0;
    isReloading: boolean = false;
    reloadTime: number; // in seconds

    wantsToShoot: boolean = false;
    wantsToReload: boolean = false;
    isShooting: boolean = false;


    constructor(tag: string, ammo: number, magSize: number, fireRate: number, reloadTime: number, position: Vec2) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;

        this.magSize = magSize;
        this.ammoInGun = magSize;
        this.ammoOnHand = ammo;
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;

        this.position = new Vec2(position.x, position.y);
    }

    getShotCooldown(): number {
        return 1000 / this.fireRate; // convert fire rate to milliseconds
    }

    canShoot(currentTime: number): boolean {
        if (this.isReloading) return false;
        if (this.ammoInGun <= 0) return false;

        

        return !this.isReloading && this.ammoInGun > 0;
    }

    shoot(startX: number, startY: number, targetX: number, targetY: number, currentTime: number): Bullet | null {
        if (!this.canShoot(currentTime)) {
            return null;
        }

        this.ammoInGun--;
        this.lastShotTime = currentTime;

        return this.createBullet(this.position.x + this.DEFAULT_XOFFSET, this.position.y + this.DEFAULT_YOFFSET, targetX, targetY);
    }

    canReload(): boolean {
        return !this.isReloading && this.ammoInGun < this.magSize && this.ammoOnHand > 0;
    }

    reload(): void {
        
        
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

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();

        const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;
        
        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);

        this.animator.drawCurrentAnimFrameAtOrigin(ctx, 0.1, 0.1);

        ctx.restore();
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {

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

            // ---------- track mouse movement ----------
        
            // direction
            const dir = new Vec2(mouseWorldX - this.position.x, mouseWorldY - this.position.y);
            
            // normalize (guard against zero length)
            const length = Math.hypot(dir.x, dir.y);
            if (length <= 1e-6) {
                dir.x = 1;
                dir.y = 0;
            } else {
                dir.x /= length;
                dir.y /= length;
            }

            this.travelAngle = Math.atan2(dir.y, dir.x);

        }
        
        

        // Update gun position to player's position
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;

        // Calculate shoulder position (pivot point)
        // const shoulderX = player.position.x + this.DEFAULT_XOFFSET;
        // const shoulderY = player.position.y + this.DEFAULT_YOFFSET;

        // if (mouseWorldX !== null && mouseWorldY !== null) {
        //     // Calculate angle from shoulder to mouse
        //     const dx = mouseWorldX - shoulderX;
        //     const dy = mouseWorldY - shoulderY;
        //     this.travelAngle = Math.atan2(dy, dx);

            //  console.log(`${this.travelAngle.toFixed(2)} radians, ${(this.travelAngle * (180 / Math.PI)).toFixed(1)} degrees`);
        // }

        // this.position.x = shoulderX + Math.cos(this.travelAngle) * this.GUN_LENGTH;
        // this.position.y = shoulderY + Math.sin(this.travelAngle) * this.GUN_LENGTH;
        let offX: number;
        let offY: number;
        if (this.travelAngle > 0) {
            offX = this.DEFAULT_XOFFSET + this.travelAngle / 2;
            offY = this.DEFAULT_YOFFSET - this.travelAngle / 2;
        } else if (this.travelAngle < 0) {
            offX = this.DEFAULT_XOFFSET + this.travelAngle / 2;
            offY = this.DEFAULT_YOFFSET + this.travelAngle / 2;
        } else { 
            offX = this.DEFAULT_XOFFSET;
            offY = this.DEFAULT_YOFFSET;
        }

        this.position.x = player.position.x + offX;
        this.position.y = player.position.y - offY;


        // ---------- Animation Logic ----------
        if (this.isShooting) {
            // continue playing attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.wantsToShoot) {
            // start attack animation
            this.animator.updateAnimState(AnimationState.ATTACK, deltaTime);
        } else if (this.isReloading) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else if (this.wantsToReload) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
        } else {
            // Idle animation state
            this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        }
        
    }

    protected abstract createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet;
}