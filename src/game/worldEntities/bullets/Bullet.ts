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
import { Zombie } from "../../zombies/Zombie.js";

export abstract class Bullet implements Entity, Collidable {
    /**
     * Angle at which the projectile is facing/traveling.
     */
    protected travelAngle: number;

    /**
     * abstract properties
     */
    abstract physicsCollider: BoxCollider;
    abstract sprite: ImagePath;
    abstract animator: Animator;

    abstract damage: number;
    protected abstract onEnemyHit(zombie: Entity): void;
    protected abstract onTerrainHit(): void;
    protected abstract shouldRemoveOnHit(): boolean;

    public tag: string;
    public id: EntityID;
    public velocity: Vec2 = new Vec2();
    public position: Vec2 = new Vec2();
    public removeFromWorld: boolean = false;

    constructor(tag: string, startX: number, startY: number, angle: number) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;


        this.position.x = startX;
        this.position.y = startY;

        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;
        this.velocity.x = Math.cos(angle) * 100 + player.velocity.x;
        this.velocity.y = Math.sin(angle) * 100 + player.velocity.y;
        this.travelAngle = angle;
    }

    /**
    * Draw the projectile.
    */
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.translate(screenX, screenY);
        ctx.rotate(this.travelAngle);

        this.animator.drawCurrentAnimFrameAtOrigin(ctx);

        ctx.restore();
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        // move the bullet
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        // ---------- Collision with terrain ----------
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.onTerrainHit();
                // console.log(`${this.tag} hit the mountain`);
            }
        }

        // ---------- Collision with zombies ----------
        const zombies: Zombie[] = GameEngine.g_INSTANCE.getAllZombies();
        //console.log(`zombies in world: ${zombies.length}`);
        for (const zombie of zombies) {
            if (this.physicsCollider.collides(this, zombie) && zombie.health > 0) {
                this.onEnemyHit(zombie);
                // console.log(`${this.tag} hit a zombie`);
            }
        }

        // remove if offscreen
        if (
            this.position.x < GameEngine.g_INSTANCE.viewportX - GameEngine.WORLD_UNITS_IN_VIEWPORT ||
            this.position.x > GameEngine.g_INSTANCE.viewportX + GameEngine.WORLD_UNITS_IN_VIEWPORT + GameEngine.WORLD_UNITS_IN_VIEWPORT ||
            this.position.y < GameEngine.g_INSTANCE.viewportY - GameEngine.WORLD_UNITS_IN_VIEWPORT ||
            this.position.y > GameEngine.g_INSTANCE.viewportY + GameEngine.WORLD_UNITS_IN_VIEWPORT + GameEngine.WORLD_UNITS_IN_VIEWPORT
        ) {
            this.removeFromWorld = true;
        }
    }
}