import { DrawLayer } from "./types.js";
import { Entity, EntityID } from "./Entity.js";
import { Timer } from "./timer.js";
import { AssetManager, AudioPath, ImagePath } from "./assetmanager.js";
import { unwrap } from "./util.js";
import { G_CONFIG } from "../game/CONSTANTS.js";
import { BoxCollider } from "./physics/BoxCollider.js";
import { Renderer } from "./Renderer.js";

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
    private audioUnlock = false;

    private ctx: CanvasRenderingContext2D;
    private entities: [Entity, DrawLayer][];
    private uniqueEntities: Record<string, [Entity, DrawLayer]> = {};
    private click: { x: number, y: number } | null;
    private mouse: { x: number, y: number } | null;
    private wheel: { x: number, y: number } | null;
    private keys: { [key: string]: boolean };
    private options: { debugging: boolean };
    private running: boolean;
    private timer: Timer;
    private rightclick: { x: number, y: number };
    private clockTick: number;
    private assetManager: AssetManager;
    private m_Renderer: Renderer;

    public get renderer(): Renderer {
        return this.m_Renderer;
    }

    viewportX: number = 0;
    viewportY: number = 0;
    zoom: number = 1;
    private loopCall = () => this.loop();

    constructor(assetManager: AssetManager, options?: { debugging: boolean; }) {
        if (GameEngine.g_INSTANCE != undefined) {
            throw new Error("GameEngine has already been initialized!");
        }

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
        this.rightclick = { x: 0, y: 0 };
        this.clockTick = 0;
        this.assetManager = assetManager;

        const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.m_Renderer = new Renderer(this.ctx);
        this.startInput();
        this.timer = new Timer();

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

    getAudio(path: AudioPath): HTMLAudioElement {
        return unwrap(this.assetManager.getAudio(path), `Failed to get audio for ${path.asRaw()}!`);
    }


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

        // Unlock audio on first user interaction because browsers block audio until user interacts with the page
        const unlockAudio = () => {
            if (this.audioUnlock) return;
            this.audioUnlock = true;
            this.startMusic();
            console.log("Audio unlocked!");
        };

        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
            this.rightclick = this.mouse;
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
            unlockAudio();
        });

        this.ctx.canvas.addEventListener("mousedown", e => {
            if (this.options.debugging) {
                console.log("MOUSE_DOWN", getXandY(e));
            }
            this.keys["Mouse" + e.button] = true;
        });

        this.ctx.canvas.addEventListener("mouseup", e => {
            if (this.options.debugging) {
                console.log("MOUSE_UP", getXandY(e));
            }
            this.keys["Mouse" + e.button] = false;
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

        this.ctx.canvas.addEventListener("keydown", event => {
            this.keys[event.key] = true
            unlockAudio();
        });

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

        // Sort the entities by their draw priority, lower numbers = drawn later, bigger numbers = drawn earlier.
        // And then draw them, no garuntee of order when their draw priority is the same.
        this.entities.sort((a, b) => b[1] - a[1])
        for (const [ent] of this.entities) {
            this.ctx.save();
            const t0 = performance.now();
            ent.draw(this.ctx, this);
            const t = t0 - performance.now();
            this.ctx.restore();
            if (t > 10) {
                console.warn(`Ent: ${ent.id} took ${t.toFixed(3)}ms to draw`);
            }
        }

        if (G_CONFIG.DRAW_PHYSICS_COLLIDERS) {
            const meterInPixelsX = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            const meterInPixelsY = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            for (const ent of this.entities) {
                if (ent[0].physicsCollider !== null && ent[0].physicsCollider instanceof BoxCollider) {
                    const collider = ent[0].physicsCollider;

                    const screenX =
                        ((ent[0].position.x - collider.width / 2 - this.viewportX) * meterInPixelsX) / this.zoom;

                    // Bottom-center -> top-left for canvas
                    const screenY =
                        ((ent[0].position.y - collider.height - this.viewportY) * meterInPixelsY) / this.zoom;

                    const screenW =
                        (collider.width * meterInPixelsX) / this.zoom;

                    const screenH =
                        (collider.height * meterInPixelsY) / this.zoom;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = "red";
                    this.ctx.strokeRect(
                        screenX,
                        screenY,
                        screenW,
                        screenH
                    );
                    this.ctx.closePath();
                }
            }
        }
    };

    update(dt: number) {
        for (const [entity] of this.entities) {
            if (!entity.removeFromWorld) {
                const t0 = performance.now();
                entity.update(this.keys, dt, this.rightclick);
                const t = t0 - performance.now();
                if (t > 10) {
                    console.warn(`Ent: ${entity.id} took ${t.toFixed(3)}ms to update!`);
                }

            }
        }

        const player = this.getUniqueEntityByTag('player');
        if (player && this.ctx) {
            /* 1. Horizontal follow */
            const playerScreenRatioX = 0.15;                       // 15 % from left edge
            const playerWorldOffsetX = playerScreenRatioX * GameEngine.WORLD_UNITS_IN_VIEWPORT;
            this.viewportX = player.position.x - playerWorldOffsetX;

            /* 2. Vertical follow – centre the player */
            const worldUnitsH = this.ctx.canvas.height / (this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT);
            this.viewportY = player.position.y - worldUnitsH / 2;
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
        requestAnimationFrame(this.loopCall);
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

    startMusic(): void {
        const audioPath = new AudioPath("res/aud/game_music.ogg");
        const audio = this.getAudio(audioPath);
        audio.play();
        audio.loop = true;
        audio.volume = 0.2;
    };
};
