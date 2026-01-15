import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity } from "../engine/Entity.js";
import { clamp, unwrap, } from "../engine/util.js";
import { Mountain } from "./mountain.js";

/**
 * @author PG
 * @description The main player class.
 */
export class Player implements Entity {
    xV: number = 0;
    yV: number = 0;
    physicsCollider = new BoxCollider(1, 2);

    sprite: ImagePath = new ImagePath("res/img/player.png");
    X: number = 0;
    Y: number = 0;
    removeFromWorld: boolean = false;
    tag: string = "player";

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);

        const player_width_in_world_units = 4;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.X - game.viewportX) * scale / game.zoom;
        const screenY = (this.Y - game.viewportY) * scale / game.zoom;

        ctx.drawImage(
            sprite,
            screenX - w / 2,
            screenY - h,
            w,
            h
        );
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        const onGround = this.yV === 0; // fix later

        // -- Base movement: simulating sliding down a mountain --
        const slideForce = 10; // Constant downward and rightward force
        this.xV += slideForce * deltaTime;

        // -- Player input --

        // D key: Speed up
        if (keys["d"]) {
            this.xV += 250 * deltaTime;
        }

        // A key: Brake
        if (keys["a"]) {
            this.xV = Math.max(1, this.xV - 200 * deltaTime); // Reduce x velocity, but not below 1
            this.yV = Math.max(1, this.yV - 200 * deltaTime); // Reduce y velocity, but not below 1
        }

        // W or Space key: Jump
        if ((keys["w"] || keys[" "]) && onGround) {
            this.yV = -15; // Apply an upward force for jumping
        }


        // -- Physics simulation --

        // Gravity
        this.yV += GameEngine.g_INSTANCE.G * deltaTime;

        // Friction
        const friction = 0.01;
        this.xV *= (1 - friction);

        // Apply velocity to position
        this.X += this.xV * deltaTime;
        this.Y += this.yV * deltaTime;

        // -- Collision with terrain --
        const mountain = unwrap(GameEngine.g_INSTANCE.getEntityByTag("mountain"));
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                // TODO: Make the position jump to the nearest surface, or the amount moved should be 
                // proportional to the distance we are below the terrain
                this.Y -= this.physicsCollider.height;
                this.yV = 0;
            }
        }
    }
}
