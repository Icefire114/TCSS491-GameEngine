import { ImagePath } from "../../engine/assetmanager.js";
import { Entity } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { Item } from "./Item.js";

export class ItemEntity implements Entity {
    id: `${string}#${string}-${string}-${string}-${string}-${string}`;
    tag: string = "ItemEntity";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    // TODO: Collision with items should not be considered when doing physics collisions, just item pickups.
    physicsCollider: Collider = new BoxCollider(2, 2);
    sprite: ImagePath;
    removeFromWorld: boolean = false;

    /**
     * The item this entity represents.
     */
    item: Item;

    constructor(item: Item, position?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.item = item;
        this.sprite = item.sprite;
        if (position) {
            this.position = position;
        }
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        ctx.drawImage(
            sprite,
            (this.position.x - game.viewportX) * meter_in_pixels / game.zoom,
            (this.position.y - game.viewportY) * meter_in_pixels / game.zoom,
            sprite.width,
            sprite.height
        );
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }

}