import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { unwrap } from "../engine/util.js";
import { Vec2 } from "../engine/types.js";
import { Item } from "./Items/Item.js";
import { ItemEntity } from "./Items/ItemEntity.js";
import { Collidable } from "../engine/physics/Collider.js";

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

    /**
     * The items the player has picked up.
     */
    items: Item[] = [];

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }


    // TODO(pg): When we are going down a slope, we shhould rotate both player and snowboard to be perpendicular to the slope

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);

        const player_width_in_world_units = 5;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        ctx.drawImage(
            sprite,
            screenX - w / 2,
            screenY - h,
            w,
            h
        );
        this.drawSnowboard(ctx, game);
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
            screenX - w / 2,
            screenY - h + 9,
            w,
            h
        )
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        const onGround = this.velocity.y === 0; // TODO: fix later

        // -- Base movement: simulating sliding down a mountain --
        // I like having this around 5, but for testing i have it at 0
        const slideForce = 0; // Constant rightward force

        this.velocity.x += slideForce * deltaTime;

        // -- Player input --

        // D key: Speed up
        if (keys["d"]) {
            this.velocity.x += 250 * deltaTime;
        }

        // A key: Brake
        if (keys["a"]) {
            this.velocity.x -= 250 * deltaTime;

            // this.velocity.x = Math.max(1, this.velocity.x - 200 * deltaTime); // Reduce x velocity, but not below 1
            // this.velocity.y = Math.max(1, this.velocity.y - 200 * deltaTime); // Reduce y velocity, but not below 1
        }

        // W or Space key: Jump
        if ((keys["w"] || keys[" "]) && onGround) {
            this.velocity.y = -15; // Apply an upward force for jumping
        }


        // -- Physics simulation --

        // Gravity
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime;

        // Friction
        const friction = 0.01;
        this.velocity.x *= (1 - friction);

        // Apply velocity to position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        // -- Collision with terrain --
        const mountain = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain"));
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                // TODO: Make the position jump to the nearest surface, or the amount moved should be 
                // proportional to the distance we are below the terrain
                this.position.y -= this.physicsCollider.height;
                this.velocity.y = 0;
            }
        }

        // Item pickup checks:
        const items: ItemEntity[] = GameEngine.g_INSTANCE.getEntitiesByTag("ItemEntity") as ItemEntity[];
        for (const item of items) {
            if (this.physicsCollider.collides(this, item)) {
                console.log(`We hit item ${item.item.tag}`);
            }
        }
    }
}
