import { Collider, Collidable } from "./Collider.js";
import { MountainCollider } from "./MountainCollider.js";

export class BoxCollider implements Collider {
    public width: number;
    public height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * Checks if this collider collides with the other collider.
     * @param other The other collidable thing to check for collision with
     * @returns `true` if this collider collides with the other colider, `false` otherwide
     */
    collides(thisEntity: Collidable, otherEntity: Collidable): boolean {
        if (otherEntity.physicsCollider instanceof MountainCollider) {
            return otherEntity.physicsCollider.collides(otherEntity, thisEntity);
        } else if (otherEntity.physicsCollider instanceof BoxCollider) {
            return (thisEntity.position.x + this.width > otherEntity.position.x &&
                thisEntity.position.x < otherEntity.position.x + otherEntity.physicsCollider.width &&
                thisEntity.position.y + this.height > otherEntity.position.y &&
                thisEntity.position.y < otherEntity.position.y + otherEntity.physicsCollider.height);
        }

        return false;
    }
};