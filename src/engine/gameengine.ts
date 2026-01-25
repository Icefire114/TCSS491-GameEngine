import { DrawLayer } from "./types.js";
import { Entity, EntityID } from "./Entity.js";
import { Timer } from "./timer.js";
import { AssetManager, ImagePath } from "./assetmanager.js";
import { sleep, unwrap } from "./util.js";

export class GameEngine {
    /**
     * The single instance of the game engine.
     */
    public static g_INSTANCE: GameEngine;
    public static readonly WORLD_UNITS_IN_VIEWPORT = 100;

    private static readonly TARGET_FPS: number = 120;
    /**
     * The gravitational constant in meters per second squared.
     */
    readonly G = 9.80665;

    private static readonly FIXED_DT = 1 / GameEngine.TARGET_FPS;
    private accumulator = 0;

    private ctx: CanvasRenderingContext2D | null;
    private entities: [Entity, DrawLayer][];
    private uniqueEntities: Record<string, [Entity, DrawLayer]> = {};
    private click: { x: number, y: number } | null;
    private mouse: { x: number, y: number } | null;
    private wheel: { x: number, y: number } | null;
    private keys: { [key: string]: boolean };
    private options: { debugging: boolean };
    private running: boolean;
    private timer: Timer;
    private rightclick: { x: number, y: number } | null;
    private clockTick: number;
    private assetManager: AssetManager;

    private m_terrainData: { y: number[]; } | null = null;
    public get terrainData(): { y: number[]; } | null {
        return this.m_terrainData;
    }
    public set terrainData(value: { y: number[]; } | null) {
        this.m_terrainData = value;
    }

    viewportX: number = 0;
    viewportY: number = 0;
    zoom: number = 1;

    constructor(assetManager: AssetManager, options?: { debugging: boolean; }) {
        if (GameEngine.g_INSTANCE != undefined) {
            throw new Error("GameEngine has already been initialized!");
        }
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
        this.running = false;
        this.timer = new Timer();
        this.rightclick = null;
        this.clockTick = 0;
        this.assetManager = assetManager;

        const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.init(ctx);
        GameEngine.g_INSTANCE = this;
    };

    /**
     * @param path The path to the image.
     * @returns An image from the given path.
     * @throws If the given `path` is not in the image cache.
     */
    getSprite(path: ImagePath): HTMLImageElement {
        return unwrap(this.assetManager.getImage(path), `Failed to get sprite for ${path.asRaw()}!`);
    }


    init(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    start() {
        this.running = true;
        this.loop();
    };

    startInput() {
        if (!this.ctx) {
            throw new Error("Lost canvas context!");
        }

        const getXandY = (e: MouseEvent) => ({
            x: e.clientX - (this.ctx?.canvas.getBoundingClientRect().left as number),
            y: e.clientY - (this.ctx?.canvas.getBoundingClientRect().top as number)
        });

        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.deltaY, e.deltaX);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key] = false);
    };

    /**
     * Registers an entity to be drawn and updated when the engine ticks.
     *
     * @param entity The entity to add.
     * @param drawPriority The priority in which entites should be drawn, 
     * lower numbers = drawn earlier, bigger numbers = drawn later.
     */
    addEntity(entity: Entity, drawPriority: DrawLayer) {
        this.entities.push([entity, drawPriority]);
    };

    /**
    * Registers a unique entity to be drawn and updated when the engine ticks, 
    * these entities will be tracked separately and only one single instance 
    * of these entities should ever exist.
    *
    * @param entity The entity to add.
    * @param drawPriority The priority in which entites should be drawn, 
    * lower numbers = drawn earlier, bigger numbers = drawn later.
    */
    addUniqueEntity(entity: Entity, drawPriority: DrawLayer) {
        this.addEntity(entity, drawPriority);
        this.uniqueEntities[entity.tag] = [entity, drawPriority];
    };

    draw() {
        if (!this.ctx) {
            throw new Error("Lost canvas context!");
        }
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Sort the entities by their draw priority, lower numbers = drawn earlier, bigger numbers = drawn later.
        // And then draw them, no garuntee of order when their draw priority is the same.
        this.entities.sort((a, b) => a[1] - b[1])
        for (const ent of this.entities) {
            ent[0].draw(this.ctx, this);
        }
    };

    update(dt: number) {
        for (const [entity] of this.entities) {
            if (!entity.removeFromWorld) {
                entity.update(this.keys, dt);
            }
        }

        // Update camera to follow player.
        const player = this.getUniqueEntityByTag("player");
        if (player && this.ctx) {
            // Horizontal following
            const player_screen_pecentage_x = 0.15;
            const player_world_offset_x = player_screen_pecentage_x * GameEngine.WORLD_UNITS_IN_VIEWPORT;
            this.viewportX = player.position.x - player_world_offset_x;

            // Vertical following (center player)
            const aspect_ratio = this.ctx.canvas.height / this.ctx.canvas.width;
            const world_units_in_viewport_y = GameEngine.WORLD_UNITS_IN_VIEWPORT * aspect_ratio;
            this.viewportY = player.position.y - (world_units_in_viewport_y / 2);
        }

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i][0].removeFromWorld) {
                delete this.uniqueEntities[this.entities[i][0].tag];
                this.entities.splice(i, 1);
            }
        }
    };

    loop() {
        let frameTime = this.timer.tick();
        frameTime = Math.min(frameTime, 0.25); // prevent spiral of death

        this.accumulator += frameTime;

        while (this.accumulator >= GameEngine.FIXED_DT) {
            this.update(GameEngine.FIXED_DT);
            this.accumulator -= GameEngine.FIXED_DT;
        }

        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    /**
     * @param tag The tag of the entity to find
     * @returns The entity with the given tag or undefined if no such entity could be found.
     */
    getEntitiesByTag(tag: string): Entity[] {
        return this.entities
            .filter(ent => ent[0].tag === tag)
            .map(ent => ent[0]);
    };

    /**
     * @param tag The tag of the entity to find
     * @returns The entity with the given tag or undefined if no such entity could be found.
     */
    getUniqueEntityByTag(tag: string): Entity | undefined {
        return this.uniqueEntities[tag]?.[0];
    };

    /**
     * @param id The unique ID of the entity to get
     * @returns The entity with the given ID or undefined if no such entity could be found.
     */
    getEntityByID(id: EntityID): Entity | undefined {
        return this.entities.find(ent => ent[0].id === id)?.[0];
    }

    /**
     * @returns A list of all entities with physics.
     */
    getEntitiesWithPhysics(): Entity[] {
        return this.entities
            .filter(ent => ent[0].physicsCollider !== null)
            .map(ent => ent[0]);
    };
};
