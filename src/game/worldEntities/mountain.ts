import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { MountainCollider } from "../../engine/physics/MountainCollider.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { DrawLayer, Vec2 } from "../../engine/types.js";
import { G_CONFIG } from "../CONSTANTS.js";
import { SafeZone } from "./SafeZone.js";
import Rand from 'rand-seed';

export interface SafeZoneData {
    index: number;
    startX: number;
    endX: number;
}

export class Mountain implements Entity {
    // Required identifcation used by the Game Engine
    tag: string = "mountain";
    id: EntityID;
    physicsCollider: MountainCollider;
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    // Random Seed Generator
    private rng: Rand;

    // Anchor Points Setup
    private anchorPointsList: Vec2[] = [];
    private lastAnchor: Vec2;

    // Ravine Setup
    private isRavineSequence = false;
    private ravineStep = 0;
    private ravineBaseY = 0;
    private ravineWidth = 0;
    private minRavineWidth = 10;
    private maxRavineWidth = 25;
    private slopeBeforeRavine = 0;
    private lastRavineEndX = 0;
    private ravineCooldown = 150;
    private ravineStartShowing = 150;

    // Plain Setup (Level Checkpoint)
    private flatSequenceOn = false;
    private flatStep = 0;
    private flatBaseY = 0;
    private flatGenerationTick = 10;
    private flatCooldown = 150;
    private flatStartShowing = 150
    private flatEndX: number = 0;

    // "Safezone" tracking
    private safeZones: SafeZoneData[] = [];
    private tempSafeZoneStartX: number = 0;
    private minDistanceBetweenZones = 2000;
    private maxDistanceBetweenZones = 3500;

    /**
     * Initalizing the moutain entity.
     */
    constructor(seed: string) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.rng = new Rand(seed);

        // Initialize the staring anchor
        const startingAnchorPoint = { x: -50, y: 0 };
        this.anchorPointsList.push(startingAnchorPoint);
        this.lastAnchor = startingAnchorPoint;

        // Passing the anchor points array to the collider 
        this.physicsCollider = new MountainCollider(this.anchorPointsList);
    }


    /**
     * Main method to draw for the moutain.
     * 
     * @param ctx is the canvas.
     * @param game is the gameengine.
     */
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const viewportRightWorld = game.viewportX + GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Generating anchor points ahead of the player by 3000 pixels
        if (this.lastAnchor.x < viewportRightWorld) {
            while (this.lastAnchor.x < viewportRightWorld + 3000) {
                this.generatingAnchor();
            }
        }

        // If anchor point is beyound the Viewport screen, delete anchor points (after 300)
        const cleanupThreshold = game.viewportX - 300;
        while (this.anchorPointsList.length > 0 && this.anchorPointsList[0].x < cleanupThreshold) {
            this.anchorPointsList.shift();
        }

        // Drawing the moutain 
        this.drawMoutain(ctx, game, scale);

        // Seeing anchor points
        if (G_CONFIG.DRAW_TERRAIN_ANCHOR_POINTS) {
            this.drawPoints(ctx, game, scale);
        }
    }


    /**
     * Method that handles the overarching moutain logic generation. 
     * 
     * @param ctx is the canvas.
     * @param game is the game engine.
     * @param scale is the canvs with in relation to the game engine world viewport. 
     * @returns early if there's less than 2 anchor points
     */
    drawMoutain(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number) {
        if (this.anchorPointsList.length < 2) return;

        ctx.beginPath();

        // Setting the canvas path position (leftmost rendered point)
        const startX = (this.anchorPointsList[0].x - game.viewportX) * scale;
        const startY = (this.anchorPointsList[0].y - game.viewportY) * scale;

        // Were drawing from the very bottom of the canvas at the start X
        ctx.moveTo(startX, ctx.canvas.height);
        ctx.lineTo(startX, startY);

        // Drawing points iteslf 
        for (let i = 0; i < this.anchorPointsList.length - 1; i++) {
            // Getting the anchor points of current + next
            const currentPoint = this.anchorPointsList[i];
            const nextPoint = this.anchorPointsList[i + 1];

            // Convert each anchor point x and y values with in relation to viewport offset + scaling 
            const currentPointX = (currentPoint.x - game.viewportX) * scale;
            const currentPointY = (currentPoint.y - game.viewportY) * scale;
            const nextPointX = (nextPoint.x - game.viewportX) * scale;
            const nextPointY = (nextPoint.y - game.viewportY) * scale;

            // Calculating the midpoint between the 2 anchor points
            const midX = (currentPointX + nextPointX) / 2;
            const midY = (currentPointY + nextPointY) / 2;

            // Using quadraticCurveTo method that uses some quadratic Bezier Interpolation to draw the points
            ctx.quadraticCurveTo(currentPointX, currentPointY, midX, midY);
        }

        // Closing the shape at the bottom-right
        const lastPoint = this.anchorPointsList[this.anchorPointsList.length - 1];
        const lastX = (lastPoint.x - game.viewportX) * scale;
        ctx.lineTo(lastX, ctx.canvas.height);
        ctx.lineTo(startX, ctx.canvas.height);

        // Drawing the moutain
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
        ctx.lineTo(0, ctx.canvas.height);
        ctx.closePath();
        ctx.fillStyle = "#C2D4E6";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Method to visually see the anchor points
     * 
     * @param ctx is the context of the canvas.
     * @param game is the game engine.
     */
    drawPoints(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number): void {
        // Points Design
        ctx.fillStyle = "red";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        // Looping through the points array and drawing base on viewpoint
        for (let i = 0; i < this.anchorPointsList.length; i++) {
            const point = this.anchorPointsList[i];
            const screenX = (point.x - game.viewportX) * scale;
            const screenY = (point.y - game.viewportY) * scale;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }


    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        // Unused.
    }


    /**
     * Method to generate anchor situation.
     * Either normal, ravine, or flat. 
     */
    generatingAnchor() {
        // Check weren't in a ravin sequence
        if (this.isRavineSequence) {
            this.generateRavineAnchor();
            return;
        }

        // Checking if were in a flat generation
        if (this.flatSequenceOn || G_CONFIG.TERRAIN_GENERATION_FORCE_FLAT) {
            this.generateFlatAnchor();
            return;
        }

        // Storing the last anchor x position 
        const currentX = this.lastAnchor.x;

        // Logic for safe zones

        const distanceSinceLastSafeZone = currentX - this.flatEndX;

        let shouldSpawnFlat = false;

        // We havent taveled far enough
        if (distanceSinceLastSafeZone < this.minDistanceBetweenZones) {
            shouldSpawnFlat = false;
        }
        // Travel way too long, we force a spawn
        else if (distanceSinceLastSafeZone > this.maxDistanceBetweenZones) {
            shouldSpawnFlat = true;
            console.log("Force Spawning Safe Zone (Max Distance Reached)");
        }
        else {
            // Passed the min, then its a .5% chance per anchor point for it to spawn
            if (this.rng.next() < 0.005) {
                shouldSpawnFlat = true;
            }
        }

        // logic for ravine
        const pastSpawnPoint = currentX > this.ravineStartShowing;
        const coolDownRavine = currentX > (this.lastRavineEndX + this.ravineCooldown);

        if (shouldSpawnFlat) {
            this.startFlatSequence();
            console.log(`Spawning SafeZone at x: ${currentX}`);
            GameEngine.g_INSTANCE.addEntity(new SafeZone(new Vec2(currentX, this.getHeightAt(currentX))), DrawLayer.WORLD_DECORATION);
        }
        // We can only spawn a ravine if we're not in a safe zone
        else if (pastSpawnPoint && coolDownRavine && this.rng.next() < 0.1) {
            this.startRavineSequence();
        }
        else {
            this.generateNormalAnchor();
        }

    }

    /**
     * Generating a normal anchor points logic. 
     */
    generateNormalAnchor() {
        // Getting our last anchor values that we generated
        let anchorX = this.lastAnchor.x + 25;
        let changeAnchorY = this.rng.next() < 0.5 ? -this.randomIntFromInterval(3, 7) : this.randomIntFromInterval(3, 30);

        // Setting the new generated anchor point into our list
        const newAnchor = { x: anchorX, y: this.lastAnchor.y + changeAnchorY };
        this.anchorPointsList.push(newAnchor);
        this.lastAnchor = newAnchor;
    }

    /**
     * Setup for a staring a ravine sequence anchor
     */
    startRavineSequence() {
        this.isRavineSequence = true;
        this.ravineStep = 0;
        this.ravineBaseY = this.lastAnchor.y;
        this.ravineWidth = this.randomIntFromInterval(this.minRavineWidth, this.maxRavineWidth);
        this.generateRavineAnchor();
    }

    /**
     * Sequence to generate a predefine anchor to make a ravine
     */
    generateRavineAnchor() {
        // Getting the last anchor points
        let x = this.lastAnchor.x;
        let y = this.lastAnchor.y;

        // Ravine sequence where it dips, then gap, then rise back up
        switch (this.ravineStep) {
            case 0: // The ravine entrance
                x += 5;
                y += 0;
                break;
            case 1: // The ravine drop
                x += 3;
                y += 5000;
                break;
            case 2: // The ravine gap
                x += this.ravineWidth;
                y += 0;
                break;
            case 3: // Rising up from the ravine
                x += 1;
                y = this.ravineBaseY;
                break;
            case 4: // Continuing as normal
                x += 10;
                y = this.ravineBaseY + this.slopeBeforeRavine;
                this.isRavineSequence = false;
                this.lastRavineEndX = x;
                break;
        }

        // Setting the new anchor to our list 
        const newAnchor: Vec2 = { x, y };
        this.anchorPointsList.push(newAnchor);
        this.lastAnchor = newAnchor;
        this.ravineStep++;
    }

    /**
     * Setup for starting a flat sequence
     */
    startFlatSequence() {
        this.flatSequenceOn = true;
        this.flatStep = 0;
        this.flatBaseY = this.lastAnchor.y;
        this.tempSafeZoneStartX = this.lastAnchor.x;
        console.log("Flat Generation is happening right now")
    }

    /**
     * Generating a flat ground
     */
    generateFlatAnchor() {
        // x is increasing +15 pixels, while y stays the same
        let x = this.lastAnchor.x + 15;
        let y = this.flatBaseY;

        // Setting the new anchor point, and continuing the generation 
        const newAnchor = { x: x, y: y };
        this.anchorPointsList.push(newAnchor);
        this.lastAnchor = newAnchor;
        this.flatStep++;

        // After 10 ticks, return to normal generation
        if (this.flatStep >= this.flatGenerationTick) {
            this.flatSequenceOn = false;
            this.flatEndX = x;

            // updating our safezone tracking with specific info
            this.safeZones.push({
                index: this.safeZones.length,
                startX: this.tempSafeZoneStartX,
                endX: this.flatEndX
            });
        }
    }

    /**
     * Random generate a number between a min and max
     * 
     * @param min represents the min number to generate. 
     * @param max represents the max number to generate. 
     * @returns a randomly generated number between min and max. 
     */
    randomIntFromInterval(min: number, max: number) {
        return Math.floor(this.rng.next() * (max - min + 1) + min);
    }

    /**
     * Finding the height when given a x (solve by using the quadratic Bezier)
     */
    getHeightAt(x: number): number {
        if (this.anchorPointsList.length < 2) return 0;

        for (let i = 0; i < this.anchorPointsList.length - 1; i++) {
            const pPrev = i === 0 ? this.anchorPointsList[0] : this.anchorPointsList[i - 1];
            const pCurr = this.anchorPointsList[i];
            const pNext = this.anchorPointsList[i + 1];

            const startX = (pPrev.x + pCurr.x) / 2;
            const endX = (pCurr.x + pNext.x) / 2;

            // Checking if the given x is within our area
            if (x >= startX && x <= endX) {
                const startY = (pPrev.y + pCurr.y) / 2;
                const endY = (pCurr.y + pNext.y) / 2;

                // Solving the 't', aka which position is our x in relation to our area
                // Reference:  
                // Bezier formula for x is: x = (1-t)^2*x0 + 2(1-t)t*x1 + t^2*x2
                // Quadratic equation: at^2 + bt + c = 0
                const a = startX - 2 * pCurr.x + endX;
                const b = 2 * (pCurr.x - startX);
                const c = startX - x;

                let t = 0;
                if (Math.abs(a) < 0.0001) {
                    t = -c / b;
                } else {
                    const discriminant = b * b - 4 * a * c;
                    t = (-b + Math.sqrt(Math.max(0, discriminant))) / (2 * a);
                }

                //  Calculating the Y using that found t we just did 
                return (Math.pow(1 - t, 2) * startY) +
                    (2 * (1 - t) * t * pCurr.y) +
                    (Math.pow(t, 2) * endY);
            }
        }

        // For boundaries
        if (x < this.anchorPointsList[0].x) {
            return this.anchorPointsList[0].y;
        }
        return this.anchorPointsList[this.anchorPointsList.length - 1].y;
    }

    /**
     * Calculting the slope at point x.
     */
    getSlopeAt(x: number): number {
        const epsilon = 0.01;
        const y1 = this.getHeightAt(x - epsilon);
        const y2 = this.getHeightAt(x + epsilon);
        return (y2 - y1) / (2 * epsilon);
    }

    /**
     * Returns a vector that points away from the surface.
     */
    getNormalAt(x: number): Vec2 {
        const slope = this.getSlopeAt(x);
        const nx = -slope;
        const ny = 1;

        const length = Math.hypot(nx, ny);
        return new Vec2(nx / length, ny / length);
    }

    // When given 
    getSafeZone(index: number): SafeZoneData | null {
        if (index < 0 || index >= this.safeZones.length) {
            return null;
        }
        return this.safeZones[index];
    }

    getSafeZoneStatus(x: number): {
        currentZoneIndex: number; // -1  represents we're not in safe zone
        lastPassedZoneIndex: number;
    } {
        // Either before zone or during our game
        let status = {
            currentZoneIndex: -1, // -1  represents we're not in safe zone
            lastPassedZoneIndex: -1
        };

        for (let i = 0; i < this.safeZones.length; i++) {
            const z = this.safeZones[i];

            if (x >= z.startX && x <= z.endX) {
                // Represent were in the the zone
                status.currentZoneIndex = i;
                status.lastPassedZoneIndex = i - 1;
                return status;
            }
            else if (x > z.endX) {
                // Represnt were pass the zone
                status.lastPassedZoneIndex = i;
            }
        }
        return status;
    }

}