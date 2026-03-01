import { GameEngine } from "../../engine/gameengine.js";
import { Background } from "./Background.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { Vec2 } from "../../engine/types.js";

export class DayNightCycle implements Entity {
    id: EntityID;
    tag: string = "DayNightCycle"
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = null;
    sprite = null;
    removeFromWorld = false;

    sunSprite: ImagePath;
    moonSprite: ImagePath;

    // 0 to 1, full cycle
    cycleTime = 0;
    // seconds for a full day/night cycle
    cycleDuration = 120; 

    private lastTime = performance.now();
    private rawTime = 0;

    constructor(spritePaths: ImagePath[]) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.sunSprite = spritePaths[0];
        this.moonSprite = spritePaths[1];
    }
    
    // 0.0 - 0.5 = day (sun), 0.5 - 1.0 = night (moon)
    get isDay() {
        return this.cycleTime < 0.5; 
    }

    // get timeOfDayAlpha() {
    //     if (this.isDay) return 0;
    //     const t = (this.cycleTime - 0.5) * 2;
    //     return Math.sin(t * Math.PI);
    // }

    get timeOfDayAlpha() {
    // Start darkening at 0.4 (before sun exits) and peak darkness at 0.75 (moon middle)
    // Then lighten back to 0 by 1.0 (before sun enters)
    const darkStart = 0.4;
    const darkEnd = 1.0;
    const t = (this.cycleTime - darkStart) / (darkEnd - darkStart);
    
    if (this.cycleTime < darkStart) return 0; // full day
    
    // sin curve peaks in the middle of the night
    return Math.max(0, Math.sin(t * Math.PI));
}

    update(keys: { [key: string]: boolean }, deltaTime: number) {
        // Keep position near player to avoid culling
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player");
        if (player) {
            this.position.x = player.position.x;
            this.position.y = player.position.y;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "low";
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.rawTime += deltaTime;
        this.cycleTime = (this.rawTime / this.cycleDuration) % 1;

        const sprite = this.isDay ? game.getSprite(this.sunSprite) : game.getSprite(this.moonSprite);
        
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // Arc across the screen: 0 = left horizon, 0.5 = top, 1 = right horizon
        const t = this.isDay ? this.cycleTime * 2 : (this.cycleTime - 0.5) * 2;
        const size = W * 0.5;
        
        // Parametric arc using sin for Y (peaks at center) and lerp for X
        const x = W * 1.1 - t * W * 1.2;
        const y = H * 0.2 - Math.sin(t * Math.PI) * H * 0.1;

        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    }
}