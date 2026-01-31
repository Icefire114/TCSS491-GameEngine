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
            const thisLeft = thisEntity.position.x - this.width / 2;
            const thisTop = thisEntity.position.y - this.height;
            const otherLeft = otherEntity.position.x - otherEntity.physicsCollider.width / 2;
            const otherTop = otherEntity.position.y - otherEntity.physicsCollider.height;

            return (thisLeft + this.width > otherLeft &&
                thisLeft < otherLeft + otherEntity.physicsCollider.width &&
                thisTop + this.height > otherTop &&
                thisTop < otherTop + otherEntity.physicsCollider.height);
        }

        return false;
    }
};