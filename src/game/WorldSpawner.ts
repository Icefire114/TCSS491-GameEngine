import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Vec2, DrawLayer } from "../engine/types.js";
import { Mountain } from "./worldEntities/mountain.js";
import { BasicZombie } from "./zombies/BasicZombie.js";
import { Spike } from "./worldEntities/spike.js";
import { ItemFactory } from "./Items/ItemFactory.js";
import Rand from 'rand-seed';
import { Player } from "./worldEntities/player.js";
import { randomOf } from "../engine/util.js";

export class WorldSpawner implements Entity {
    // Required info
    id: EntityID;
    tag: string = "world_spawner";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = null;
    sprite = null;
    removeFromWorld: boolean = false;

    // Spawn logic
    private lastSpawnX = 0;
    private spawnInterval = 40;
    private rng: Rand;

    constructor(seed: string) {
        this.id = `spawner#${crypto.randomUUID()}`;
        this.rng = new Rand(seed + "spawner");
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        // Ensures that player and mountain is created before updating
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player;
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (!player || !mountain) {
            return;
        }

        // Check 100 game units ahead of the player
        const spawnX = player.position.x + 300;
        const currentY = player.position.y;

        // Only try to spawn if we've moved past our interval
        if (spawnX > this.lastSpawnX + this.spawnInterval) {
            this.lastSpawnX = spawnX;
            this.executeSpawn(spawnX, currentY, mountain);
        }
    }

    /**
     * Method that handles the execution of the spawns.
     * 
     * @param x represents the x position.
     * @param mountain represents the moutain entity.
     * @returns only if the x position given, has a y above 1000.
     */
    private executeSpawn(x: number, playerY: number, mountain: Mountain) {
        // If the x position given, has a y above 1000, its in ravine, so don't spawn
        const y = mountain.getHeightAt(x);
        if (y > playerY + 1000) {
            return;
        }

        // Rolling the seeded random generator
        const roll = this.rng.next();

        // Probaiblty for the spawn 
        if (roll < 0.3) {
            // 30% chance for Zombie
            GameEngine.g_INSTANCE.addEntity(new BasicZombie({ x, y: y - 5 }), DrawLayer.ZOMBIE);
        }
        else if (roll < 0.45) {
            // 15% chance for Spike
            // How many spikes to generate from 2 to 4
            const clusterSize = Math.floor(this.rng.next() * 4) + 2;
            const spacing = 2.1;

            for (let i = 0; i < clusterSize; i++) {
                const currentX = x + (i * spacing);
                const currentY = mountain.getHeightAt(currentX);

                // Calculate rotation so each spike in the group tilts with the slope
                const normal = mountain.getNormalAt(currentX);
                const rotation = Math.atan2(normal.y, normal.x) - Math.PI / 2;

                const spike = new Spike({ x: currentX, y: currentY }, rotation);
                GameEngine.g_INSTANCE.addEntity(spike, DrawLayer.SPIKE);
            }
        }
        else if (roll < 0.65) {
            // Each item has a even shot at being spawned
            const pos = new Vec2(x, y - 2);
            GameEngine.g_INSTANCE.addEntity(
                randomOf([
                    ItemFactory.createHealthPack(pos),
                    ItemFactory.createShieldRestore(pos),
                    ItemFactory.createGun(pos),
                    ItemFactory.createImmunity(pos)
                ]),
                 DrawLayer.ITEM);
        }
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // useless
    }
}