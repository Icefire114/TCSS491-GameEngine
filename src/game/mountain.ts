import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { MountainCollider } from "../engine/physics/MountainCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";
import { G_CONFIG } from "./CONSTANTS.js";

// Object that holds the anchor point x, y and that camera angle 
type MountainPoint = Vec2 & { cameraTargetY: number };

export class Mountain implements Entity {
    tag: string = "mountain";
    id: EntityID;
    physicsCollider: MountainCollider | null = null;
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    // Anchor Points Setup
    private points: MountainPoint[] = [];
    private lastAnchor: MountainPoint;

    // Ravine use fields
    private isRavineSequence: boolean = false;
    private ravineStep: number = 0;
    private ravineBaseY: number = 0;
    private ravineWidth = 0;
    private minRavineWidth: number = 10;
    private maxRavineWidth: number = 25;
    private slopeBeforeRavine: number = 0;
    private lastRavineEndX: number = 0;
    private ravineCooldown = 150;
    private ravineStartShowing = 150;


    // Flat plains logic
    private flatSequenceOn: boolean = false;
    private flatStep: number = 0;
    private flatBaseY: number = 0;
    private flatGenerationTick = 10;
    private flatCooldown = 150;
    private flatStartShowing = 150
    private flatEndX: number = 0;

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;

        // Initialize the staring anchor
        const startY = 0;
        const startingPoint = { x: -50, y: startY, cameraTargetY: startY };
        this.points.push(startingPoint);
        this.lastAnchor = startingPoint;

        // Setting the collider to have the live points array
        this.physicsCollider = new MountainCollider(this.points);
    }


    /**
     * Main method to draw for the moutain
     * 
     * @param ctx is the canvas
     * @param game is the gameengine
     */
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        /* Info Page:
            - game.viewportX value is always constantly increasing...
            - GameEngine.WORLD_UNITS_IN_VIEWPORT = 100;
            - Canvas Width = 1024
        */

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const viewport_right_world = game.viewportX + GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Generating anchor points ahead of the player
        if (this.lastAnchor.x < viewport_right_world) {
            while (this.lastAnchor.x < viewport_right_world + 3000) {
                this.generatingAnchor();
            }
        }

        // If anchor point is beyound the Viewport screen, delete anchor points
        const cleanupThreshold = game.viewportX - 300;
        while (this.points.length > 0 && this.points[0].x < cleanupThreshold) {
            this.points.shift();
        }

        // Drawing the moutain 
        this.drawMoutain(ctx, game, scale);

        // Uncomment to see anchor dots
        if (G_CONFIG.DRAW_TERRAIN_ANCHOR_POINTS) {
            this.drawPoints(ctx, game, scale);
        }
    }

    drawMoutain(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number) {
        if (this.points.length < 2) return;

        ctx.beginPath();

        // This will closed propelry when filling 
        const startX = (this.points[0].x - game.viewportX) * scale;
        const startY = (this.points[0].y - game.viewportY) * scale;

        // Were drawing from the very bottom of the canvas at the start X
        ctx.moveTo(startX, ctx.canvas.height);
        ctx.lineTo(startX, startY);

        for (let i = 0; i < this.points.length - 1; i++) {
            const currentPoint = this.points[i];
            const nextPoint = this.points[i + 1];

            // Getting each anchor point x and y values
            const currentPointX = (currentPoint.x - game.viewportX) * scale;
            const currentPointY = (currentPoint.y - game.viewportY) * scale;
            const nextPointX = (nextPoint.x - game.viewportX) * scale;
            const nextPointY = (nextPoint.y - game.viewportY) * scale;

            // Calculating the midpoint between the 2 anchor points
            const midX = (currentPointX + nextPointX) / 2;
            const midY = (currentPointY + nextPointY) / 2;

            // Using quadraticCurveTo method taht uses some quadratic Bezier Interpolation
            ctx.quadraticCurveTo(currentPointX, currentPointY, midX, midY);
        }

        // Closeign the shape at the bottom-right
        const lastPoint = this.points[this.points.length - 1];
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
     * test method to visually see the anchor points
     * 
     * @param ctx is the context of the canvas.
     * @param game is the game engine.
     */
    drawPoints(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number): void {
        ctx.fillStyle = "red";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        // Looping through the points array and drawing base on viewpoint
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
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
     * Either normal or ravine anchor events. 
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

        const currentX = this.lastAnchor.x;

        // Spawn ravine only if it past the spawn point area
        const pastSpawnPoint = currentX > this.ravineStartShowing;
        // Try to spawn a ravine only if the cool down is gone
        const coolDown = currentX > (this.lastRavineEndX + this.ravineCooldown);


        // Spawn and cool down for flats
        const pastSpawnPointForFlat = currentX > this.flatStartShowing;
        const cooldownForFlat = currentX > (this.flatEndX + this.flatCooldown);

        // Probablity of a ravine spawns or not, if not, then do normal 
        if (pastSpawnPoint && coolDown && Math.random() < 0.1) {
            this.startRavineSequence();
            console.log("RAVINE SPAWN")
        } else if (pastSpawnPointForFlat && cooldownForFlat && Math.random() < .15) {
            this.startFlatSequence();
            console.log("Im being generated?")
        } else {
            this.generateNormalAnchor();
        }
    }

    /**
     * Generating a normal anchor points
     */
    generateNormalAnchor() {
        // Getting our last anchor values that we generated
        let anchorX = this.lastAnchor.x;
        let anchorY = this.lastAnchor.y;

        // How much our new anchor is going to go in the x direction
        anchorX += 25;

        // Logic what anchor y direction should go, up or down, and how much so
        const movementChoice = Math.random() < 0.5 ? "Up" : "Down";
        let changeOfY = 0;
        if (movementChoice == "Up") {
            changeOfY -= this.randomIntFromInterval(3, 7);
        } else {
            changeOfY += this.randomIntFromInterval(3, 30);
        }

        anchorY += changeOfY;
        this.slopeBeforeRavine = changeOfY;

        // Creating the new anchor along with that camera angle for that specific x position
        // Then adding it our point array and updating our lastAnchor points too
        const newAnchor = { x: anchorX, y: anchorY, cameraTargetY: anchorY };
        this.points.push(newAnchor);
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

        // Setting the camera to follow along the last and not through the ravine points
        let ghostCamera = this.lastAnchor.cameraTargetY;

        // Ravine sequence where it dips, then gap, then rise back up
        switch (this.ravineStep) {
            case 0: // The ravine entrance
                x += 5;
                y += 0;
                ghostCamera += 5;
                break;
            case 1: // The ravine drop
                x += 3;
                y += 5000;
                ghostCamera += this.ravineWidth / 2;
                break;
            case 2: // The ravine gap
                x += this.ravineWidth;
                y += 0;
                ghostCamera += this.ravineWidth / 2;
                break;
            case 3: // Rising up from the ravine
                x += 1;
                y = this.ravineBaseY;
                ghostCamera += 0;
                break;
            case 4: // Continuing as normal
                x += 10;
                y = this.ravineBaseY + this.slopeBeforeRavine;
                ghostCamera = y;
                this.isRavineSequence = false;
                this.lastRavineEndX = x;
                break;
        }

        const newAnchor: MountainPoint = { x, y, cameraTargetY: ghostCamera };
        this.points.push(newAnchor);
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
        console.log("Flat Generation is happening right now")
    }

    /**
     * Generating a flat ground
     */
    generateFlatAnchor() {
        let x = this.lastAnchor.x + 15;
        let y = this.flatBaseY;

        const newAnchor = { x: x, y: y, cameraTargetY: y };
        this.points.push(newAnchor);
        this.lastAnchor = newAnchor;

        this.flatStep++;

        // After 10 ticks, return to normal generation
        if (this.flatStep >= this.flatGenerationTick) {
            this.flatSequenceOn = false;
            this.flatEndX = x;

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
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getHeightAt(x: number): number {
        for (let i = 0; i < this.points.length - 1; i++) {
            const p0 = this.points[i];
            const p1 = this.points[i + 1];

            if (x >= p0.x && x <= p1.x) {
                const t = (x - p0.x) / (p1.x - p0.x);
                return p0.y + t * (p1.y - p0.y);
            }
        }
        return 0;
    }

    getSlopeAt(x: number, epsilon = 0.1): number {
        const y1 = this.getHeightAt(x - epsilon);
        const y2 = this.getHeightAt(x + epsilon);
        return (y2 - y1) / (2 * epsilon);
    }

    getNormalAt(x: number): Vec2 {
        const slope = this.getSlopeAt(x);

        // Perpendicular to tangent
        const nx = -slope;
        const ny = 1;

        const length = Math.hypot(nx, ny);
        return new Vec2(nx / length, ny / length);
    }
}