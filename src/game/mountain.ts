import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity } from "../engine/types.js";

export class Mountain implements Entity {
    private m_terrainData: { y: number[] } | null = null;
    constructor() {
        fetch('res/levels/main.json').then(response => response.json()).then(data => {
            this.m_terrainData = data;
        });
    }

    X: number = 0;
    Y: number = 0;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (this.m_terrainData == null) {
            console.error("Mountain terrain data not yet loaded!");
            return;
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}