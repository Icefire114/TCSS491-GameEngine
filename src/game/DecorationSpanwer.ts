import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Vec2, DrawLayer } from "../engine/types.js";
import { Mountain } from "./mountain.js";
import { Tree } from "./worldDeco/Tree.js";
import { Bush } from "./worldDeco/Bush.js";
import { Rock } from "./worldDeco/Rock.js";
import Rand from 'rand-seed';

export class DecorationSpawner implements Entity {
    id: EntityID;
    tag: string = "decoration_spawner";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = null;
    sprite = null;
    removeFromWorld: boolean = false;

    // Logic
    private lastSpawnX = 0;
    private spawnInterval = 15; 
    private rng: Rand;
    private activeDecorations: Entity[] = []; 
    private lastSafeZoneIndex: number = -1;



    constructor(seed: string) {
        this.id = `deco_spawner#${crypto.randomUUID()}`;
        this.rng = new Rand(seed + "deco");
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player");
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        
        // NO player, no moutain, don't run
        if (!player || !mountain) {
            return;
        }

        const status = mountain.getSafeZoneStatus(player.position.x);

        if (status.currentZoneIndex !== -1 && status.currentZoneIndex > this.lastSafeZoneIndex) {
            this.cleanupOldDecorations();
            this.lastSafeZoneIndex = status.currentZoneIndex;
        }


        const spawnX = player.position.x + 350;
        const currentY = player.position.y;

        
        // Rnadomzing the space to make it more "natural"
        const randomSpace = (this.rng.next() * 10) - 5; 
        
        // When to spawn logic
        if (spawnX > this.lastSpawnX + this.spawnInterval + randomSpace) {
            this.lastSpawnX = spawnX;
            this.executeSpawn(spawnX, currentY, mountain);
        }
    }

    /**
     * Helper method to execute all the different types of decorations spawn rates
     * 
     * @param x repreesents the x position
     * @param mountain represents the moutain
     * @returns only return if were trying to spawn in the ravines
     */
    private executeSpawn(x: number, playerY: number, mountain: Mountain) {
        const y = mountain.getHeightAt(x);
        
        if (y > playerY + 1000){
            return;
        }

        const roll = this.rng.next();
        let decoration: Entity | null = null; 

        // Heres all the spawn rate for all decorations
        if (roll < 0.5) {
            // 50% Bush
            decoration = new Bush(new Vec2(x, y));
        } else if (roll < 0.8) {
            // 30% Tree
            decoration = new Tree(new Vec2(x, y));
        } else if (roll < 0.9) {
            // 10% Rock
            decoration = new Rock(new Vec2(x, y));
        }
        // 10% Empty space (clearing)

        if (decoration) {
            GameEngine.g_INSTANCE.addEntity(decoration, DrawLayer.WORLD_DECORATION);
            this.activeDecorations.push(decoration); 
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // none 
    }


    private cleanupOldDecorations() {
        for (const decoration of this.activeDecorations) {
            decoration.removeFromWorld = true; 
        }
        
        this.activeDecorations = []; 
    }
}