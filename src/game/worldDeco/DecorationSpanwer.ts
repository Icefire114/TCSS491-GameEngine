import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Vec2, DrawLayer } from "../../engine/types.js";
import { Mountain } from "../worldEntities/mountain.js";
import { Tree } from "./Tree.js";
import { Bush } from "./Bush.js";
import { Rock } from "./Rock.js";
import Rand from 'rand-seed';
import { randomOfWeighted } from "../../engine/util.js";
import { DecoFactory } from "./DecorationFactory.js";

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
    // Min distance palyer travel before spawning another decoration 
    private spawnInterval = 35;
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

            if (this.lastSpawnX < player.position.x) {
                this.lastSpawnX = player.position.x;
            }
        }

        if (this.lastSpawnX < player.position.x - 500) {
            this.lastSpawnX = player.position.x - 400;
        }


        const spawnX = player.position.x + 350;

        // When to spawn logic
        while (this.lastSpawnX < spawnX) {
            this.lastSpawnX += this.spawnInterval;

            // Rnadomzing the space to make it more "natural"
            const randomSpace = (this.rng.next() * 20);
            const actualX = this.lastSpawnX + randomSpace;

            this.executeSpawn(actualX, player.position.y, mountain);
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
        if (mountain.isNearSafeZone(x, 25)) {
            return;
        }

        const roll = this.rng.next();
        const yCenter = mountain.getHeightAt(x);

        // Safety constraints to sure decorations doesn't spawn or near ravines
        const safetyBuffer = 60;
        const yCheckLeft = mountain.getHeightAt(x - safetyBuffer);
        const yCheckRight = mountain.getHeightAt(x + safetyBuffer);

        const isNearEdge = (yCheckLeft > yCenter + 100) || (yCheckRight > yCenter + 100);
        const isRavineFloor = yCenter > playerY + 800;

        if (isNearEdge || isRavineFloor) {
            return;
        }

        // Calculate slope for the center point
        const sampleDistance = 20;
        const yLeft = mountain.getHeightAt(x - sampleDistance);
        const yRight = mountain.getHeightAt(x + sampleDistance);
        const maxSlope = Math.max(
            Math.abs(Math.atan2(yCenter - yLeft, sampleDistance) * (180 / Math.PI)),
            Math.abs(Math.atan2(yRight - yCenter, sampleDistance) * (180 / Math.PI))
        );

        if (maxSlope > 25) return;

        let decoration: Entity | undefined = randomOfWeighted(
            [
                {
                    obj: DecoFactory.createBush(new Vec2(x, yCenter)) as Entity,
                    weight: 0.2
                },
                {
                    obj: DecoFactory.createTree(new Vec2(x, yCenter)) as Entity,
                    weight: 0.3
                },
                {
                    obj: DecoFactory.createRock(new Vec2(x, yCenter)) as Entity,
                    weight: 0.2
                },
                {
                    obj: DecoFactory.createFireBarrel(new Vec2(x, yCenter)) as Entity,
                    weight: 0.1
                },
                {
                    obj: DecoFactory.createCrate(new Vec2(x, yCenter)) as Entity,
                    weight: 0.1
                },
                {
                    obj: undefined,
                    weight: 0.2
                }
            ],
            this.rng
        );
        let yAdjustment = 0;

        if (decoration !== undefined) {
            if (decoration instanceof Bush) {
                yAdjustment = 30;
            } else if (decoration instanceof Tree) {
                yAdjustment = -100;
            } else if (decoration instanceof Rock) {
                yAdjustment = 42;
            }
        }

        if (decoration) {
            // Working to get that decoration sink in ground
            const lowestGround = Math.max(yCenter, yLeft, yRight);
            const safetyBury = 5;

            decoration.position.y = lowestGround - yAdjustment + safetyBury;
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