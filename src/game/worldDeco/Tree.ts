import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { unwrap } from "../../engine/util.js";
import { SunShader } from "../../engine/WebGL/SunShader.js";
import { G_CONFIG } from "../CONSTANTS.js";
import { Mountain } from "../mountain.js";

export class Tree implements Entity {
    tag: string = "Tree";
    id: EntityID;

    position: Vec2;
    // trees cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath = new ImagePath("res/img/world_deco/tree_1.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                frameCount: 1,
                frameHeight: 512,
                frameWidth: 512,
                sprite: new ImagePath("res/img/world_deco/tree_1.png")
            },
            AnimationState.IDLE
        ]
    ],
        // new Vec2(4, 10)
    );
    shader: SunShader | undefined = undefined;

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (G_CONFIG.NEW_RENDERER) {
            const currentAnim = {
                sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
                frameWidth: 512,
                frameHeight: 512,
                frameCount: 1,
                offsetX: 0
            };

            if (this.shader === undefined) {
                this.shader = new SunShader(currentAnim.sprite);
                console.log("Shader created, canvas size:", this.shader.canvas.width, this.shader.canvas.height);
            }


            this.shader.render(-60);

            const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            const worldW = currentAnim.frameWidth / meterInPixels;
            const worldH = currentAnim.frameHeight / meterInPixels;
            const screenW = (worldW * meterInPixels) / game.zoom;
            const screenH = (worldH * meterInPixels) / game.zoom;

            const screenX =
                ((this.position.x - (worldW / 2) - game.viewportX + currentAnim.offsetX) * meterInPixels) / game.zoom;
            const screenY =
                ((this.position.y - worldH - game.viewportY) * meterInPixels) / game.zoom;

            ctx.drawImage(
                this.shader.canvas,
                screenX,
                screenY,
                screenW,
                screenH
            );
        } else {
            this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}
