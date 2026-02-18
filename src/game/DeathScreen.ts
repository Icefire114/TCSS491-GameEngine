import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";

export class DeathScreen implements Entity {
    // Required info
    readonly id: EntityID = `death_screen#${crypto.randomUUID()}` as EntityID;
    readonly tag = "death_screen";
    position: Vec2;
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null = null;
    sprite = null;
    removeFromWorld = false;

    // The blackhole settings
    private originX: number = 0;
    private originY: number = 0;
    private maxRadius: number = 0;
    private radius: number = 0;
    private initialized: boolean = false;

    // Setup for the blackhole expanding
    private phase: "expanding" | "showing" = "expanding";
    private readonly START_RADIUS = 18;
    private readonly EXPAND_SPEED = 200; 
    private alpha: number = 0;
    private readonly FADE_SPEED = 0.5;

    private pulseTime: number = 0;
    private onRestart: () => void;

    constructor(playerWorldX: number, playerWorldY: number, onRestart: () => void) {
        this.position = new Vec2(playerWorldX, playerWorldY);
        this.onRestart = onRestart;
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, _click: Vec2): void {
        this.pulseTime += deltaTime;

        // Process of doing the black hole expanding to the text showing on screen
        if (this.phase === "expanding") {
            const progress = this.radius / this.maxRadius;
            this.radius += this.EXPAND_SPEED * (1 + progress * 1.5) * deltaTime;
            if (this.radius >= this.maxRadius) {
                this.radius = this.maxRadius;
                this.phase = "showing";
            }
        } else {
            this.alpha = Math.min(1, this.alpha + this.FADE_SPEED * deltaTime);
            if (this.alpha >= 1 && (keys["Enter"] || keys["r"] || keys["Mouse0"])) {
                this.onRestart();
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        if (!this.initialized) {
            this.initialized = true;
            this.maxRadius = Math.sqrt(W * W + H * H);
            this.radius = this.START_RADIUS;
            const meterInPixels = W / GameEngine.WORLD_UNITS_IN_VIEWPORT;
            this.originX = (this.position.x - engine.viewportX) * meterInPixels / engine.zoom;
            this.originY = ((this.position.y - 1.5) - engine.viewportY) * meterInPixels / engine.zoom;
        }

        ctx.save();

        // That Green blob expanding to fill the screen
        if (this.phase === "expanding") {
            ctx.beginPath();
            ctx.arc(this.originX, this.originY, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#023502";
            ctx.fill();

        } else {
            // The background 
            ctx.fillStyle = "#0a1a0a";
            ctx.fillRect(0, 0, W, H);

            // For the text to fade in
            ctx.globalAlpha = this.alpha;
            ctx.textAlign = "center";

            // Infection Title with glow
            ctx.fillStyle = "#00cc00";
            ctx.shadowColor = "#00ff00";
            ctx.shadowBlur = 20;
            ctx.font = `bold ${W * 0.042}px monospace`;
            ctx.fillText("[ INFECTION DETECTED ]", W / 2, H * 0.32);
            ctx.shadowBlur = 0;

            // YOU DIED Text
            ctx.fillStyle = "#c0392b";
            ctx.font = `bold ${W * 0.09}px monospace`;
            ctx.fillText("YOU DIED", W / 2, H * 0.48);

            // info teext
            ctx.fillStyle = "#3a6e3a";
            ctx.shadowBlur = 0;
            ctx.font = `${W * 0.021}px monospace`;
            ctx.fillText("The virus has claimed another host.", W / 2, H * 0.60);
            ctx.fillText("The mountain never forgives.", W / 2, H * 0.645);

            // The pulsing restart
            const pulse = Math.abs(Math.sin(performance.now() / 600));
            ctx.globalAlpha = this.alpha * pulse;
            ctx.fillStyle = "#00cc00";
            ctx.shadowColor = "#00ff00";
            ctx.shadowBlur = 10;
            ctx.font = `${W * 0.025}px monospace`;
            ctx.fillText("[ PRESS R OR ENTER TO RESTART ]", W / 2, H * 0.78);

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.textAlign = "left";
        }

        ctx.restore();
    }
}