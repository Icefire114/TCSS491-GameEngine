import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { MountainCollider } from "../engine/physics/MountainCollider.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { clamp, unwrap } from "../engine/util.js";
import { Vec2 } from "../engine/types.js";

export class Mountain implements Entity {
    tag: string = "mountain";
    id: EntityID;
    physicsCollider: MountainCollider | null = null;

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        // Load the default level into the engine
        fetch('res/levels/testing.json').then(response => response.json()).then(data => {
            GameEngine.g_INSTANCE.terrainData = data;
            this.physicsCollider = new MountainCollider(data.y);
            unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")).position.y = data.y[0] + 20;
        });
    }

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
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

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}

