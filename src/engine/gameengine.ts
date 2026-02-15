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
    // a mapping of entity tags to a list of entities with that tag.
    private ents: Map<string, Set<[Entity, DrawLayer]>>;
    private uniqueEnts: Map<string, [Entity, DrawLayer]>;
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
    private m_followingEnt: Entity | null = null;
    private m_followPercenageX: number = 0.1;
    private m_followPercentageY: number = 0.5;
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

        this.ents = new Map<string, Set<[Entity, DrawLayer]>>();
        this.uniqueEnts = new Map<string, [Entity, DrawLayer]>();

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
        this.ctx.imageSmoothingEnabled = false;
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
     * @returns The entity that was added.
     */
    addEntity(entity: Entity, drawPriority: DrawLayer): Entity {
        let ents = this.ents.get(entity.tag);
        if (!ents) {
            ents = new Set<[Entity, DrawLayer]>();
            this.ents.set(entity.tag, ents);
        }
        ents.add([entity, drawPriority]);
        return entity;
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
    addUniqueEntity(entity: Entity, drawPriority: DrawLayer): Entity {
        this.addEntity(entity, drawPriority);
        this.uniqueEnts.set(entity.tag, [entity, drawPriority]);
        return entity;
    };

    draw() {
        if (!this.ctx) {
            throw new Error("Lost canvas context!");
        }
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Sort the entities by their draw priority, lower numbers = drawn later, bigger numbers = drawn earlier.
        // And then draw them, no garuntee of order when their draw priority is the same.

        const ents = Array.from(this.ents.values())
            .flatMap(set => Array.from(set));
        ents.sort((a, b) => b[1] - a[1])
        for (const [ent] of ents) {
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
            for (const ent of ents) {
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
        for (const set of this.ents.values()) {
            for (const [entity] of set) {
                if (!entity.removeFromWorld) {
                    const t0 = performance.now();
                    entity.update(this.keys, dt, this.rightclick);
                    const t = t0 - performance.now();
                    if (t > 10) {
                        console.warn(`Ent: ${entity.id} took ${t.toFixed(3)}ms to update!`);
                    }

                }
            }
        }

        this.followEntByScreenRatioX(unwrap(this.m_followingEnt), this.m_followPercenageX);
        this.followEntByScreenRatioY(unwrap(this.m_followingEnt), this.m_followPercentageY);


        for (const set of this.ents.values()) {
            for (const ent of set) {
                if (ent[0].removeFromWorld) {
                    this.uniqueEnts.delete(ent[0].tag);
                    set.delete(ent);
                }
            }
        }
    };

    positionScreenOnEnt(e: Entity, percentageX: number, percentageY: number): void {
        this.m_followingEnt = e;
        this.m_followPercenageX = percentageX;
        this.m_followPercentageY = percentageY;
    }

    repositionScreenOnCurrentFollowedEnt(percentageX: number, percentageY: number): void {
        this.m_followPercenageX = percentageX;
        this.m_followPercenageX = percentageY;
    }

    /**
     * Sets the viewport to follow the player horizontally by a percentage of the viewport.
     *
     * @param x The percentage offset within the viewport the player should be at, must be in range `0-1`.
     */
    private followEntByScreenRatioX(e: Entity, x: number): void {
        if (e.physicsCollider !== null && e.physicsCollider instanceof BoxCollider) {
            const playerWorldOffsetX = x * GameEngine.WORLD_UNITS_IN_VIEWPORT;
            this.viewportX = e.position.x - playerWorldOffsetX + e.physicsCollider.width / 2;
        } else {
            const playerWorldOffsetX = x * GameEngine.WORLD_UNITS_IN_VIEWPORT;
            this.viewportX = e.position.x - playerWorldOffsetX;
        }
    }

    /**
     * Sets the viewport to follow the player vertically by a percentage of the viewport.
     *
     * @param y The percentage offset within the viewport the player should be at, must be in range `0-1`.
     */
    private followEntByScreenRatioY(e: Entity, y: number): void {
        const worldUnitsH = this.ctx.canvas.height / (this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT);
        this.viewportY = e.position.y - worldUnitsH * y;
    }


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
        return [...this.ents.get(tag)?.values() ?? []].map(ent => ent[0]);
    };

    /**
     * @param tag The tag of the entity to find
     * @returns The entity with the given tag or undefined if no such entity could be found.
     */
    getUniqueEntityByTag(tag: string): Entity | undefined {
        return this.uniqueEnts.get(tag)?.[0];
    };

    /**
     * @returns A list of all the zombie enteties.
     */
    getAllZombies(): Entity[] {
        return [...this.ents.entries()]
            .filter(([k]) => k.includes("Zombie"))
            .flatMap(
                ([, v]) => [...v.values()]
                    .map(([ent]) => ent)
            );
    };

    startMusic(): void {
        const audioPath = new AudioPath("res/aud/game_music.ogg");
        const audio = this.getAudio(audioPath);
        audio.play();
        audio.loop = true;
        audio.volume = 0.2;
    };
};
