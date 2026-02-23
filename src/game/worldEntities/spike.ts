
import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { Vec2 } from "../../engine/types.js";
import { AnimationState, Animator } from "../../engine/Animator.js";
import { unwrap } from "../../engine/util.js";
import { Mountain } from "./mountain.js";


/**
 * @author Mani
 * @description The main Spike class.
 */
export class Spike implements Entity {
    id: EntityID;
    readonly tag = "spike";
    position: Vec2 = { x: 0, y: 0 };
    velocity: Vec2 = { x: 0, y: 0 };

    // Used for spike rotation
    rotation: number = 0;

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

    constructor(position?: Vec2, rotation: number = 0) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (position) {
            this.position = position;
        }
        this.rotation = rotation;
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        ctx.save();

        // Converting the pixles to game units
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale;
        const screenY = (this.position.y - game.viewportY) * scale;

        // Setting up the correct position and angle for the spikes
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Handling the various offset of the sprite and the viewport
        const heightOffset = .01;
        const viewPointOffset = new Vec2(game.viewportX, game.viewportY - heightOffset);

        this.animator.drawCurrentAnimFrameAtPos(viewPointOffset);

        ctx.restore();
    }
}
