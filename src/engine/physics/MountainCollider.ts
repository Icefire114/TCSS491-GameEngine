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
        // Finding where the steering point that the player is on
        let steeringPointIndex = this.findAnchorPointPassedEntity(otherEntity);

        // Safety check if such point exit
        if (steeringPointIndex <= 0 || steeringPointIndex >= this.anchorPointsReference.length - 1) {
            return false;
        }

        // Using that index in order to find the previous, steering, and forward point
        let steeringPoint = this.anchorPointsReference[steeringPointIndex];
        let startingPoint = this.anchorPointsReference[steeringPointIndex - 1];
        let endingPoint = this.anchorPointsReference[steeringPointIndex + 1];

        // Base on the start, steering, and end points, we need to find the midpoint between 
        let midpointAB = this.calculatePointsMidpoint(startingPoint, steeringPoint);
        let midpointBC = this.calculatePointsMidpoint(steeringPoint, endingPoint);


        // Calcaulting the player pecent progress in realtive to the midpoints (percent) relative to the midpoints, not the anchor points
        let entityPositionPercent = this.findingTheEntityPositionWithinTheCurve(otherEntity, midpointAB, midpointBC);

        // Using that percent to find that Y position of the curve
        let mountainGround = this.calculatingQuadraticBezier(entityPositionPercent, midpointAB, steeringPoint, midpointBC);

        // Collision logic
        if (otherEntity.position.y > mountainGround) {
            otherEntity.position.y = mountainGround;
            return true;
        }


        return false;
    }


    findAnchorPointPassedEntity(otherEntity: Collidable): number {
        const x = otherEntity.position.x;

        for (let i = 1; i < this.anchorPointsReference.length - 1; i++) {
            let midLeft = (this.anchorPointsReference[i].x + this.anchorPointsReference[i - 1].x) / 2;
            let midRight = (this.anchorPointsReference[i].x + this.anchorPointsReference[i + 1].x) / 2;

            if (x >= midLeft && x <= midRight) {
                // Returning the index in the array where the sterring point is located at
                return i;
            }

        }
        // Represent it doesn't exit
        return -1;
    }

    calculatePointsMidpoint(pointA: MountainPoint, pointB: MountainPoint): Vec2 {
        let midPointX = (pointB.x + pointA.x) / 2;
        let midPointY = (pointB.y + pointA.y) / 2;

        return { x: midPointX, y: midPointY };
    }

    findingTheEntityPositionWithinTheCurve(otherEntity: Collidable, startingPoint: Vec2, endingPoint: Vec2): number {
        if (otherEntity.physicsCollider instanceof BoxCollider) {
            // Getting the enetity x position
            let entityPositionX = otherEntity.position.x + otherEntity.physicsCollider.width / 2;
            // Get the total width of the whole area we are tracking
            let totalWidthOfArea = endingPoint.x - startingPoint.x;
            // Calculating where our entity is base on our total width
            return (entityPositionX - startingPoint.x) / totalWidthOfArea;
        } else {
            throw new Error("Non BoxColliders are not supported with the mountain collider yet!");
        }

    }

    calculatingQuadraticBezier(entityPosition: number, midPointAB: Vec2, steeringPoint: MountainPoint, midPointBC: Vec2) {
        /* QuadraticBezier Formula: 
        B(t) = (1 - t)^2 * P0 + 
               2(1 - t)t * P1 + 
               t^2 * P2
        */
        let t = entityPosition;

        // We got the point of the curve in relative to the player x
        return (Math.pow(1 - t, 2) * midPointAB.y) +
            (2 * (1 - t) * t * steeringPoint.y) +
            (t * t * midPointBC.y);
    }
};