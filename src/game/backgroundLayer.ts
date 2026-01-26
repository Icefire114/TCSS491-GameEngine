import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";

/**
 * @author JK
 * @description The background layer class.
 */
export class BackgroundLayer implements Entity {
    velocity: Vec2 = GameEngine.g_INSTANCE.getEntitiesByTag("player")![0].velocity;
    position: Vec2 = new Vec2();
    physicsCollider = null;
    sprite: ImagePath;

    removeFromWorld: boolean = false;
    tag: string = "backgroundlayer";
    id: EntityID;

    parallaxSpeed: number; 
    worldWidth = 99;
    position2: Vec2 = new Vec2();
    playerPosition: Vec2 = GameEngine.g_INSTANCE.getEntitiesByTag("player")![0].position;
    widthInWorldUnits: number;
    followPlayer: boolean;

    constructor(spritePath: string, parallaxSpeed: number = 0.5, widthInWorldUnits: number = 100, startX: number = 35, startY: number = 9450, followPlayer: boolean = true) {
        this.sprite = new ImagePath(spritePath);
        this.position.x = startX;
        this.position.y = startY;
        this.parallaxSpeed = parallaxSpeed;
        this.position2.x = startX + this.worldWidth;
        this.position2.y = startY;
        this.widthInWorldUnits = widthInWorldUnits;
        this.followPlayer = followPlayer;
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        console.log(startX, startY);
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);

        const player_width_in_world_units = this.widthInWorldUnits;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        const screenX2 = (this.position2.x - game.viewportX) * scale / game.zoom;
        const screenY2 = (this.position2.y - game.viewportY) * scale / game.zoom;

        // first slide
        ctx.drawImage(
            sprite,
            screenX - w / 2,
            screenY - h,
            w,
            h
        );

        // second slide
        ctx.drawImage(
            sprite,
            screenX2 - w / 2,
            screenY2 - h,
            w,
            h
        );
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        // horizontal movement logic
        if (this.position.x + this.worldWidth < this.playerPosition.x + 35) {
            this.position.x = this.position2.x + this.worldWidth;
            //console.log("resetting position 1");
            
        } else {
            this.position.x -= this.velocity.x * this.parallaxSpeed;
        }
        if (this.position2.x + this.worldWidth < this.playerPosition.x + 35) {
            this.position2.x = this.position.x + this.worldWidth;
            //console.log("resetting position 2");
        
        } else {
            this.position2.x -= this.velocity.x * this.parallaxSpeed;
        }

        if (this.followPlayer) {
            // verticle movement logic 
            this.position.y = this.playerPosition.y + 30;
            this.position2.y = this.playerPosition.y + 30;
        } else {
            this.position.y = this.position.y;
        }
    }
}
