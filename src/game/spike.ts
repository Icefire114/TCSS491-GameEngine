import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";


/**
 * @author Mani
 * @description The main Spike class.
 */
export class Spike implements Entity {
    id: EntityID;
    readonly tag = "spike";
    position: Vec2;
    velocity: Vec2 = { x: 0, y: 0 };

    physicsCollider: BoxCollider;
    sprite: ImagePath;

    removeFromWorld = false;

    constructor(position: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;

        this.sprite = new ImagePath("res/img/spike.png");

        this.physicsCollider = new BoxCollider(32, 32); // just width and height
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        // doesn't move
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        //draws spike image
        const img = game.getSprite(this.sprite);
        ctx.drawImage(
            img,
            this.position.x,
            this.position.y,
            32,
            32
        );
    }
}
