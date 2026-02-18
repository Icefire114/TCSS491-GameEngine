import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { G_CONFIG } from "../CONSTANTS.js";

// Types of hitbox for the walls
export type RavineZoneType = "bounce" | "death";

// Ravine zone type info 
export type RavineZone = {
    type: RavineZoneType;
    x: number;
    y: number;
    width: number;
    height: number;
};

export class RavineDeathZone implements Entity {
    // Required info
    readonly id: EntityID = `RavineDeathZone#${crypto.randomUUID()}` as EntityID;
    readonly tag = "RavineDeathZone";
    position: Vec2;
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld = false;

    // Knowing which ravine zone we are in 
    readonly zones: RavineZone[];

    // Store wall X positions so bounce knows which direction to push
    readonly leftWallX: number;
    readonly rightWallX: number;

    /**
     * @param leftWallX represents the world game X of the left ravine wall
     * @param rightWallX represents the world game X of the right ravine wall
     * @param wallTopY represents the world Y of the ravine entrance
     * @param wallBottomY represents the world Y of the ravine max bottom
     * @param wallThickness represents the wall thickness
     * @param bounceHeight represents how tall each bounce wall should be
     */
    constructor(leftWallX: number, rightWallX: number, wallTopY: number, wallBottomY: number, wallThickness: number = 1, bounceHeight: number = 15) {
        this.position = new Vec2(leftWallX, wallTopY);
        this.leftWallX = leftWallX;
        this.rightWallX = rightWallX;

        const ravineDepth = wallBottomY - wallTopY;
        const deathWallHeight = ravineDepth - bounceHeight;

        // List of type of zones in the ravine
        this.zones = [
            // Left side 
            // Bounce zone of the left side
            {
                type: "bounce",
                x: leftWallX - wallThickness - 3,              
                y: wallTopY + 3,
                width: wallThickness,
                height: bounceHeight
            },
            // Death zone (below the bounce zone on the left wall)
            {
                type: "death",
                x: leftWallX - wallThickness - 3,
                y: wallTopY + bounceHeight,
                width: wallThickness,
                height: deathWallHeight
            },

            // Right side 
            // Bounce zone of the right side
            {
                type: "bounce",
                x: rightWallX + 5,  
                y: wallTopY,
                width: wallThickness,
                height: bounceHeight
            },
            // Death zone (below the bounce zone on the right wall)
            {
                type: "death",
                x: rightWallX + 4,
                y: wallTopY + bounceHeight,
                width: wallThickness,
                height: deathWallHeight
            },

            // Max, if the player pass this max bound in the ravine
            {
                type: "death",
                x: leftWallX,
                y: wallBottomY - 5,
                width: rightWallX - leftWallX,
                height: 40
            }
        ];
    }

    /**
     * Method that is checking if the player is overlaping any zone.
     */
    checkContact(x: number, y: number, playerWidth: number = 2.5, playerHeight: number = 5.25): RavineZoneType | null {
        // Using player is bottom-center anchored
        const playerLeft   = x - playerWidth / 2;
        const playerRight  = x + playerWidth / 2;
        const playerTop    = y - playerHeight;
        const playerBottom = y;

        // Death zones is always first 
        for (const zone of this.zones) {
            if (zone.type !== "death") continue;
            const overlapX = playerRight > zone.x && playerLeft < zone.x + zone.width;
            const overlapY = playerBottom > zone.y && playerTop  < zone.y + zone.height;
            if (overlapX && overlapY) return "death";
        }

        // Else, checking to bounce the player
        for (const zone of this.zones) {
            if (zone.type !== "bounce") continue;
            const overlapX = playerRight > zone.x && playerLeft < zone.x + zone.width;
            const overlapY = playerBottom > zone.y && playerTop  < zone.y + zone.height;
            if (overlapX && overlapY) return "bounce";
        }

        return null;
    }

    /**
     * Method that claculate which wall the player is closer to 
     * Used to determiene which way to bounce the player 
     * Return "left" mean palyer hit the left wallk, and should boucne right (postive x), and vice versa
     */
    getNearestWall(x: number): "left" | "right" {
        const distToLeft  = Math.abs(x - this.leftWallX);
        const distToRight = Math.abs(x - this.rightWallX);
        return distToLeft < distToRight ? "left" : "right";
    }

    update(_keys: { [key: string]: boolean }, _dt: number, _click: Vec2): void {
        // Nothing to update
    }

    // Drawing out the ravine hitbox 
    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!G_CONFIG.DRAW_PHYSICS_COLLIDERS) return; 

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        for (const zone of this.zones) {
            const sx = (zone.x - game.viewportX) * scale / game.zoom;
            const sy = (zone.y - game.viewportY) * scale / game.zoom;
            const sw = zone.width  * scale / game.zoom;
            const sh = zone.height * scale / game.zoom;

            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = zone.type === "bounce" ? "#4488ff" : "#ff2222";
            ctx.fillRect(sx, sy, sw, sh);
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = zone.type === "bounce" ? "#88bbff" : "#ff6666";
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.restore();
        }
    }
}