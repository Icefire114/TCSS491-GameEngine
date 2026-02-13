import { Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../engine/types.js";

export abstract class Zombie implements Entity {
    tag: string;
    id: EntityID;

    abstract attack_range: number;
    abstract attack_cooldown: number;
    lastAttackTime: number = 0;
    abstract run_range: number;
    abstract health: number;

    velocity: Vec2 = new Vec2();
    position: Vec2 = new Vec2();
    abstract physicsCollider: BoxCollider;
    abstract sprite: ImagePath;
    removeFromWorld: boolean = false;
    abstract reward: number; // currency reward for killing this zombie

    abstract animator: Animator;

     constructor(tag: string, pos?: Vec2) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        if (pos) {
            this.position = pos;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        this.animator.drawCurrentAnimFrameAtPos(ctx, this.position);
    }

    abstract update(keys: { [key: string]: boolean; }, deltaTime: number): void;

    takeDamage(amount: number, deltaTime: number): void {
        this.health -= amount;
    }
}