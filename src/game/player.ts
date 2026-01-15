import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Collider } from "../engine/physics/Collider.js";
import { Entity } from "../engine/Entity.js";
import { clamp } from "../engine/util.js";

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity {
    dX: number = 0;
    dY: number = 0;
    physicsCollider = new BoxCollider(10, 20);

    sprite: ImagePath = new ImagePath("res/img/player.png");
    X: number = 0;
    Y: number = 0;
    removeFromWorld: boolean = false;
    tag: string = "player";

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);   // already cached

        const w = sprite.width * 0.25;         // whatever scale you need
        const h = sprite.height * 0.25;

        ctx.drawImage(
            sprite,
            (this.X - game.viewportX) / game.zoom,
            (this.Y - game.viewportY) / game.zoom,
            w,
            h
        );
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        if (keys["a"]) {
            this.dX += -200 * deltaTime
        }
        if (keys["d"]) {
            this.dX += 200 * deltaTime
        }

        /// TODO(pg): Move down per frame, check collision with mountain (prolly should have GameEngine handle that)

        const ents: Entity[] = GameEngine.g_INSTANCE.getEntitiesWithPhysics();


        this.dY += (GameEngine.g_INSTANCE.G ** 2) * deltaTime

        this.X = clamp(this.X + (this.dX * deltaTime), 0, Infinity)
        this.Y += this.dY * deltaTime
    }
}
