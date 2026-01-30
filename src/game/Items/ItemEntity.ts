import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "../mountain.js";
import { Item } from "./Item.js";

/**
 * @author PG
 * @description Represents an item that can be picked up by the player and is existing in the game world.
 */
export class ItemEntity implements Entity, Collidable {
    id: EntityID;
    tag: string = "ItemEntity";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    // TODO: Sprite render size should be determined by the size of the collider, or the other way around!
    physicsCollider: BoxCollider = new BoxCollider(2, 2);
    sprite: ImagePath;
    removeFromWorld: boolean = false;
    animation: Animator;

    /**
     * The item this entity represents.
     */
    item: Item;

    constructor(item: Item, animator: Animator, position?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.item = item;
        this.sprite = item.sprite;
        this.animation = animator;
        if (position) {
            this.position = position;
        }
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animation.drawCurrentAnimFrameAtPos(ctx, this.position);

        // TODO: This is some simpler draw code!
        // const sprite = game.getSprite(this.sprite);

        // const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // ctx.drawImage(
        //     sprite,
        //     (this.position.x - game.viewportX) * meter_in_pixels / game.zoom,
        //     (this.position.y - game.viewportY) * meter_in_pixels / game.zoom,
        //     sprite.width,
        //     sprite.height
        // );
    }

    update(_: { [key: string]: boolean; }, deltaTime: number): void {
        // NOTE: Item pickup is handled in the player's update method, no need to do anything here except physics
        this.animation.updateAnimState(AnimationState.IDLE, deltaTime);


        // ---------- Gravity ----------
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime;

        // ---------- Collision with terrain ----------
        const mountain: Mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (mountain && mountain.physicsCollider) {
            if (this.physicsCollider.collides(this, mountain)) {
                this.velocity.y = 0;
            }
        }


        // ---------- Integrate ----------
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }
}