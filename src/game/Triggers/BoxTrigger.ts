import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/Vec2.js";

export class BoxTrigger implements Entity, Collidable {
    tag: string = "BoxTrigger";
    id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: BoxCollider;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;
    oneShot: boolean;
    onTrigger: (other: Entity) => void;
    triggerOnTags: string[];

    /**
     * 
     * @param pos The position
     * @param size The size of the trigger
     * @param toTriggerOnTag A list of Entity tags that we should call `onTrigger` when we collide with.
     * @param oneShot Should this trigger only once ever?
     * @param onTrigger To call when we trigger.
     */
    constructor(pos: Vec2, size: Vec2, toTriggerOnTag: string[], oneShot: boolean, onTrigger: (other: Entity) => void) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
        this.physicsCollider = new BoxCollider(size.x, size.y);
        this.oneShot = oneShot;
        this.triggerOnTags = toTriggerOnTag;
        this.onTrigger = onTrigger;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {

    }

    /**
     * Check if a specific entity is currently within this trigger
     * @param entity The entity to check
     * @returns `true` if the entity is within the trigger bounds
     */
    contains(entity: Entity): boolean {
        return this.physicsCollider.collides(this, entity);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        for (const tag of this.triggerOnTags) {
            const ents: Entity[] = GameEngine.g_INSTANCE.getEntitiesByTag(tag);
            for (const ent of ents) {
                if (this.physicsCollider.collides(this, ent)) {
                    this.onTrigger(ent);
                    if (this.oneShot) {
                        this.removeFromWorld = true;
                    }
                }
            }
        }
    }
}