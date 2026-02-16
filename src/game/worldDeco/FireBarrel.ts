import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { randomOf, unwrap } from "../../engine/util.js";
import { Mountain } from "../worldEntities/mountain.js";

export class FireBarrel implements Entity {
    tag: string = "FireBarrel";
    id: EntityID;

    position: Vec2;
    // barrels cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath;
    removeFromWorld: boolean = false;
    animator: Animator;

    static readonly SPRITE_PATHS = [
        new ImagePath("res/img/world_deco/fire_barrel.png"),
    ] as const;

    /**
     * 
     * @param position 
     * @param variant An optional override to force a certain sprite to be rendered.
     *  Must be a valid index of {@link Rock.SPRITE_PATHS}.
     */
    constructor(position: Vec2, scale: number = 1, variant?: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
        this.sprite = randomOf(FireBarrel.SPRITE_PATHS);
        if (variant) {
            if (variant >= FireBarrel.SPRITE_PATHS.length) {
                throw new Error("Invalid variant index");
            }
            this.sprite = FireBarrel.SPRITE_PATHS[variant];
        }
        this.animator = new Animator(
            [
                [
                    {
                        frameCount: 4,
                        frameHeight: 36,
                        frameWidth: 80,
                        sprite: this.sprite
                    },
                    AnimationState.IDLE
                ]
            ],
            new Vec2(36 * scale, 80 * scale)
        );
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