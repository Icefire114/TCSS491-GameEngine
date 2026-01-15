import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { MountainCollider } from "../engine/physics/MountainCollider.js";
import { Entity } from "../engine/Entity.js";
import { clamp, unwrap } from "../engine/util.js";
import { Player } from "./player.js";

export class Mountain implements Entity {
    physicsCollider = new MountainCollider();
    tag = "mountain";

    constructor() {
        // Load the default level into the engine
        fetch('res/levels/main.json').then(response => response.json()).then(data => {
            GameEngine.g_INSTANCE.terrainData = data;
        });
    }

    X: number = 0;
    Y: number = 0;
    dX: number = 0;
    dY: number = 0;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (GameEngine.g_INSTANCE.terrainData == null) {
            console.error("Mountain terrain data not yet loaded!");
            return;
        }

        const player: Player = unwrap(game.getEntityByTag("player")) as Player;

        const lower = clamp(Math.floor(player.X) - 20, 0, GameEngine.g_INSTANCE.terrainData.y.length)
        const upper = clamp(Math.floor(player.X) + 20, 0, GameEngine.g_INSTANCE.terrainData.y.length)

        let nodesToRender: number[] = GameEngine.g_INSTANCE.terrainData.y.slice(lower, upper);
        // console.log(`Drawing nodes ${nodesToRender}`);
        ctx.beginPath();

        let i = 0;
        ctx.moveTo(i, nodesToRender[0])
        for (i = 1; i < nodesToRender.length; i++) {
            ctx.lineTo(i, nodesToRender[i]);
        }


        ctx.strokeStyle = "#313131"
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}

