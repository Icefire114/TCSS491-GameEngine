import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";
import { AnimationState, Animator } from "../engine/Animator.js";


/**
 * @author Mani
 * @description The main Spike class.
 */
export class Spike implements Entity {
    id: EntityID;
    readonly tag = "spike";
    position: Vec2 = { x: 0, y: 0 };
    velocity: Vec2 = { x: 0, y: 0 };

    physicsCollider: BoxCollider = new BoxCollider(2, 2);
    sprite: ImagePath = new ImagePath("res/img/spike.png");

    removeFromWorld = false;
    animator: Animator = new Animator([
        [
            {
                sprite: new ImagePath("res/img/spike.png"),
                frameHeight: 128,
                frameWidth: 128,
                frameCount: 1,
            },
            AnimationState.IDLE
        ]
    ],
        { x: 2, y: 2 });

    constructor(position?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (position) {
            this.position = position;
        }
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position)
    }
}
