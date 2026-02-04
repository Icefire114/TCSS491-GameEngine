import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { unwrap } from "../../engine/util.js";
import { Mountain } from "../mountain.js";

export class Bush implements Entity {
    tag: string = "bush";
    id: EntityID;

    position: Vec2;
    // bushes cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath = new ImagePath("res/img/world_deco/bush_1.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                frameCount: 1,
                frameHeight: 512,
                frameWidth: 512,
                sprite: new ImagePath("res/img/world_deco/bush_1.png")
            },
            AnimationState.IDLE
        ]
    ]);

    constructor(position: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}