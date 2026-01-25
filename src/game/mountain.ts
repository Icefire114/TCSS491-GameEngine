import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { MountainCollider } from "../engine/physics/MountainCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { clamp, unwrap } from "../engine/util.js";
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

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        // Load the default level into the engine
        fetch('res/levels/testing.json').then(response => response.json()).then(data => {
            GameEngine.g_INSTANCE.terrainData = data;
            this.physicsCollider = new MountainCollider(data.y);
            unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")).position.y = data.y[0] + 20;
        });

        // Initialize the staring anchor
        const startY = 100;
        const startingPoint = { x: -50, y: startY, cameraTargetY: startY };
        this.points.push(startingPoint);
        this.lastAnchor = startingPoint;
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
            while (this.lastAnchor.x < viewport_right_world + 1000) {
                this.generatingAnchor();
            }
        }

        // If anchor point is beyound the Viewport screen, delete anchor points
        const cleanupThreshold = game.viewportX - 300;
        while (this.points.length > 0 && this.points[0].x < cleanupThreshold) {
            this.points.shift();
        }

        if (G_CONFIG.DRAW_OLD_MOUNTAIN) {
            this.drawFromTerrainData(ctx, game);
        } else {
            // TEMP CODE: Force Viewport to follow Moutain
            this.cameraFollowMoutain(game);

            // Uncomment to see anchor dots
            // this.drawPoints(ctx, game, scale);

            // Drawing the moutain 
            this.drawMoutain(ctx, game, scale);
        }
    }

    /**
     * A TEMP METHOD (Will delete later)
     * Used to force the camera to follow the moutain so I know the moutain generation is working
     * 
     * @param game is the game engine. 
     */
    cameraFollowMoutain(game: GameEngine) {
        // Camera following the moutain logic 

        // Finding a point in the array where such x value is greater than the x value of the view port
        const point2Index = this.points.findIndex(p => p.x > game.viewportX);

        // Finding the 2 points 
        const point1 = this.points[point2Index - 1];
        const point2 = this.points[point2Index];

        if (point1 && point2) {
            // Checking Points and Camera Position
            console.log("Point x Value: " + point1.x);
            console.log("Point y value:" + point2.x)
            console.log("Viewport x value: " + game.viewportX);

            const totalDistance = point2.x - point1.x;
            const currentDistance = game.viewportX - point1.x;
            const percentage = currentDistance / totalDistance;

            // Calculating the camera position Y using linear interpolation between 2 points 
            let exactHeight = point1.cameraTargetY + (point2.cameraTargetY - point1.cameraTargetY) * percentage;

            // Setting the camera 40 pixels above the moutain
            game.viewportY = exactHeight - 40;
        } else if (this.points.length > 0) {
            game.viewportY = this.points[0].cameraTargetY - 40;
        }
    }

    /**
     * Drawing the moutain\
     * 
     * @param ctx is the context of the canvas
     * @param game is the game engine. 
     */
    drawMoutain(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number) {
        ctx.beginPath();

        // Conver out world anchor points -> screen points, and then set our ctx to that point
        if (this.points.length > 0) {
            const startX = (this.points[0].x - game.viewportX) * scale;
            const startY = (this.points[0].y - game.viewportY) * scale;
            ctx.moveTo(startX, startY);
        }


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

    // IDK what this is used for? 
    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

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

        const currentX = this.lastAnchor.x;

        // Spawn ravine only if it past the spawn point area
        const pastSpawnPoint = currentX > this.ravineStartShowing;
        // Try to spawn a ravine only if the cool down is gone
        const coolDown = currentX > (this.lastRavineEndX + this.ravineCooldown);


        // Probablity of a ravine spawns or not, if not, then do normal 
        if (pastSpawnPoint && coolDown && Math.random() < 0.1) {
            this.startRavineSequence();
            console.log("RAVINE SPAWN")
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

        const newAnchor = { x: x, y: y, cameraTargetY: ghostCamera };
        this.points.push(newAnchor);
        this.lastAnchor = newAnchor;
        this.ravineStep++;
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


    // # Old Way: Drawing the moutain by using the Json Points
    drawFromTerrainData(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (game.terrainData == null) {
            console.error("Mountain terrain data not yet loaded!");
            return;
        }
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Render nodes that are within the viewport
        const viewport_left_world = game.viewportX;
        const viewport_right_world = game.viewportX + GameEngine.WORLD_UNITS_IN_VIEWPORT / game.zoom;

        const lower = clamp(Math.floor(viewport_left_world), 0, game.terrainData.y.length);
        const upper = clamp(Math.ceil(viewport_right_world), 0, game.terrainData.y.length);

        ctx.beginPath();

        // Move to the first point
        const startNodeX = lower;
        const startNodeY = game.terrainData.y[startNodeX];
        const screenStartX = (startNodeX - game.viewportX) * scale / game.zoom;
        const screenStartY = (startNodeY - game.viewportY) * scale / game.zoom;
        ctx.moveTo(screenStartX, screenStartY);

        // Draw lines to subsequent points
        for (let i = lower + 1; i < upper; i++) {
            const nodeY = game.terrainData.y[i];
            const screenX = (i - game.viewportX) * scale / game.zoom;
            const screenY = (nodeY - game.viewportY) * scale / game.zoom;
            ctx.lineTo(screenX, screenY);
        }

        ctx.strokeStyle = "#313131"
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}