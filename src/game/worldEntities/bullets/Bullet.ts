import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/types.js";
import { Animator } from "../../../engine/Animator.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Mountain } from "../mountain.js";
import { Player } from "../player.js";
import { unwrap } from "../../../engine/util.js";

export abstract class Bullet implements Entity, Collidable {
    protected travelAngle: number;
    tag: string;
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    abstract physicsCollider: BoxCollider;
    abstract sprite: ImagePath;
    removeFromWorld: boolean = false;
    damage: number;

    speed: number; // world units per second
    abstract animator: Animator;

    constructor(tag: string, startX: number, startY: number, endX: number, endY: number, speed: number, damage: number) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.speed = speed;
        this.damage = damage;

        this.position.x = startX;
        this.position.y = startY;

        // direction
        const dir = new Vec2(endX - startX, endY - startY);

        // normalize (guard against zero length)
        const length = Math.hypot(dir.x, dir.y);
        if (length <= 1e-6) {
            dir.x = 1;
            dir.y = 0;
        } else {
            dir.x /= length;
            dir.y /= length;
        }


        this.velocity.x = dir.x * this.speed;
        this.velocity.y = dir.y * this.speed;

        this.travelAngle = Math.atan2(dir.y, dir.x);
        console.log(`${this.tag} created at (${this.position.x}, ${this.position.y}) towards (${endX}, ${endY}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`);

    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();

        const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);

        this.animator.drawCurrentAnimFrameAtOrigin(ctx);

        ctx.restore();
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.onTerrainHit(mountain);
                // console.log(`${this.tag} hit the mountain`);
            }
        }

        // ---------- Collision with zombies ----------
        const zombies: Entity[] = GameEngine.g_INSTANCE.getAllZombies();
        //console.log(`zombies in world: ${zombies.length}`);
        for (const zombie of zombies) {
            if (this.physicsCollider.collides(this, zombie)) {
                this.onEnemyHit(zombie, zombies);
                // console.log(`${this.tag} hit a zombie`);
            }
        }

        // Move the bullet

        const playerVelocity = player.velocity;
        if (playerVelocity.x > 15) {
            this.position.x += this.velocity.x * deltaTime * playerVelocity.x / 20;
            this.position.y += this.velocity.y * deltaTime * playerVelocity.x / 20;
        } else {
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
        }

        if (this.position.x < GameEngine.g_INSTANCE.viewportX - 10 || this.position.x > GameEngine.g_INSTANCE.viewportX + GameEngine.WORLD_UNITS_IN_VIEWPORT + 10 ||
            this.position.y < GameEngine.g_INSTANCE.viewportY - 10 || this.position.y > GameEngine.g_INSTANCE.viewportY + GameEngine.WORLD_UNITS_IN_VIEWPORT + 10) {

            this.removeFromWorld = true;
        }
    }

    protected abstract onEnemyHit(zombie: Entity, allEnemies: Entity[]): void;
    protected abstract onTerrainHit(mountain: Entity): void;
    protected abstract shouldRemoveOnHit(): boolean;

}