import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Collidable } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "../mountain.js";
import { Buff } from "./Buff.js";

/**
 * @author PG
 * @description Represents a buff that can be applied to the player and is existing in the game world.
 */
export class BuffEntity implements Entity, Collidable {
    id: EntityID;
    tag: string = "BuffEntity";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: BoxCollider;
    sprite: ImagePath;
    removeFromWorld: boolean = false;
    animation: Animator;

    /**
     * The item this entity represents.
     */
    buff: Buff;

    constructor(buff: Buff, animator: Animator, colliderSize: Vec2, position?: Vec2) {
        this.id = `${this.tag}__${buff.tag}#${crypto.randomUUID()}`;
        this.buff = buff;
        this.sprite = buff.sprite;
        this.animation = animator;
        if (position) {
            this.position = position;
        }
        this.physicsCollider = new BoxCollider(colliderSize.x, colliderSize.y)
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const positionWithBBOffset = new Vec2(this.position.x, this.position.y);
        this.animation.drawCurrentAnimFrameAtPos(ctx, positionWithBBOffset);
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

    /**
     * Called when the player picks up the buff, it will apply the buff's 
     * effect by calling its `onApply` method.
     * @returns The `Buff` that was picked up so that it can be tracked by the player.
     */
    pickup(): Buff {
        const b = this.buff
        b.onApply();
        return b;
    }
}