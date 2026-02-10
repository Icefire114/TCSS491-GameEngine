import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { randomOf, unwrap } from "../../engine/util.js";
import { Mountain } from "../worldEntities/mountain.js";

export class Bush implements Entity {
    tag: string = "bush";
    id: EntityID;

    position: Vec2;
    // bushes cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath;
    removeFromWorld: boolean = false;
    animator: Animator;

    static readonly SPRITE_PATHS = [
        new ImagePath("res/img/world_deco/bush_1.png"),
        new ImagePath("res/img/world_deco/berry_bush_1.png"),
        new ImagePath("res/img/world_deco/berry_bush_2.png")
    ] as const;

    /**
     * 
     * @param position 
     * @param variant An optional override to force a certain sprite to be rendered.
     *  Must be a valid index of {@link Bush.SPRITE_PATHS}.
     */
    constructor(position: Vec2, variant?: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
        this.sprite = randomOf(Bush.SPRITE_PATHS);
        if (variant) {
            if (variant >= Bush.SPRITE_PATHS.length) {
                throw new Error("Invalid variant index");
            }
            this.sprite = Bush.SPRITE_PATHS[variant];
        }
        this.animator = new Animator([
            [
                {
                    frameCount: 1,
                    frameHeight: 512,
                    frameWidth: 512,
                    sprite: this.sprite
                },
                AnimationState.IDLE
            ]
        ]);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.animator.drawCurrentAnimFrameAtPos(this.position);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}