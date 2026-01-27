import { Player } from "../../game/player.js";
import { Vec2 } from "../types.js";
import { BoxCollider } from "./BoxCollider.js";
import { Collider, Collidable } from "./Collider.js";

type MountainPoint = Vec2 & { cameraTargetY: number };

export class MountainCollider implements Collider {


    private anchorPointsReference: MountainPoint[];

    constructor(points: MountainPoint[]) {
        this.anchorPointsReference = points;
    }

    collides(thisEntity: Collidable, otherEntity: Collidable): boolean {
        // REMINDER: Safe Check when anchor points array is -1 or is the last point in the array

        let steeringPointIndex = this.findAnchorPointPassedEntity(otherEntity);


        let steeringPoint = this.anchorPointsReference[steeringPointIndex];
        let startingPoint = this.anchorPointsReference[steeringPointIndex - 1];
        let endingPoint = this.anchorPointsReference[steeringPointIndex + 1];

        let midpointAB = this.calculatePointsMidpoint(startingPoint, steeringPoint);
        let midpointBC = this.calculatePointsMidpoint(steeringPoint, endingPoint);

        return false;
   }


    findAnchorPointPassedEntity(otherEntity: Collidable): number {
        let targetPoint = null;
        for (let i = 0; i < this.anchorPointsReference.length; i++) {
            if (this.anchorPointsReference[i].x > otherEntity.position.x) {
                targetPoint = this.anchorPointsReference[i];
                // Returning the index in the array where the sterring point is located at
                return i;                
            }
        }
        // Represent it doesn't exit
        return -1;
    }

    calculatePointsMidpoint(pointA: MountainPoint, pointB: MountainPoint): Vec2 {
        let midPointX = (pointB.x + pointA.x) / 2;    
        let midPointY = (pointB.y + pointA.y) /2;

        return {x: midPointX, y: midPointY};
    }

    // /**
    //  * Checks if this collider collides with the other collider.
    //  * @param other The other collider to check for collision with
    //  * @returns `true` if this collider collides with the other colider, `false` otherwide
    //  */
    // collides(thisEntity: Collidable, otherEntity: Collidable): boolean {
    //     if (otherEntity.physicsCollider instanceof BoxCollider && this.points) {
    //         const box = otherEntity.physicsCollider;
    //         const boxEntity = otherEntity;

    //         const boxLeft = boxEntity.position.x;
    //         const boxRight = boxEntity.position.x + box.width;
    //         const boxBottom = boxEntity.position.y;

    //         // The mountain's position is an offset.
    //         const mountainX = thisEntity.position.x;
    //         const mountainY = thisEntity.position.y;

    //         // A very simple check: get height of terrain at several points under the box.
    //         const checkPoints = [boxLeft, (boxLeft + boxRight) / 2, boxRight];
    //         for (const x of checkPoints) {
    //             const terrainX = x - mountainX;
    //             if (terrainX >= 0 && terrainX < this.points.length) {
    //                 const x1 = Math.floor(terrainX);
    //                 const x2 = Math.ceil(terrainX);
    //                 if (x1 >=0 && x2 < this.points.length) {
    //                     const y1 = this.points[x1] + mountainY;
    //                     const y2 = this.points[x2] + mountainY;
                        
    //                     let terrainHeight = y1;
    //                     if (x1 !== x2) {
    //                         terrainHeight = y1 + (y2 - y1) * (terrainX - x1) / (x2 - x1);
    //                     }

    //                     if (boxBottom > terrainHeight) {
    //                         return true;
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     return false;
    // }
};