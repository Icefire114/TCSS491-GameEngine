import { AnimationState, Animator } from "../engine/Animator.js";
import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { BoxCollider } from "../engine/physics/BoxCollider.js";
import { Vec2 } from "../engine/types.js";

export class BasicZombie implements Entity {
    tag: string = "BasicZombie";
    id: EntityID;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(2, 4);
    sprite: ImagePath = new ImagePath("res/img/player_new.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Idle.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 9
            },
            AnimationState.IDLE
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Walk_L.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 10
            },
            AnimationState.WALK_L
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Walk_R.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 10
            },
            AnimationState.WALK_R
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Jump.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 6
            },
            AnimationState.JUMP
        ],
        [
            {
                sprite: new ImagePath("res/img/zombies/Wild Zombie/Dead.png"),
                frameHeight: 96,
                frameWidth: 96,
                frameCount: 5
            },
            AnimationState.DEATH
        ]
    ]);

    constructor(pos?: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (pos) {
            this.position = pos;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}