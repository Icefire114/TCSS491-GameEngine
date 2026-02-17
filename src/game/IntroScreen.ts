import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";

export class IntroScreen implements Entity {
    // Required info
    readonly id: EntityID = `intro_screen#${crypto.randomUUID()}` as EntityID;
    readonly tag = "intro_screen";
    position: Vec2 = new Vec2(0, 0);
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null = null;
    sprite = null;
    removeFromWorld = false;

    // Intro settings
    private alpha = 1;
    private fadeOut = false;
    private onDismiss: () => void;

    constructor(onDismiss: () => void) {
        this.onDismiss = onDismiss;
    }

    update(keys: { [key: string]: boolean }, dt: number, _clickCoords: Vec2): void {
        // Well keyboard input to start
        if (keys["Enter"] || keys[" "] || keys["Mouse0"]) {
            this.fadeOut = true;
        }

        // Animation to remove our intro out  
        if (this.fadeOut) {
            this.alpha -= dt * 2;
            if (this.alpha <= 0) {
                this.removeFromWorld = true;
                this.onDismiss();
            }
            return;
        }
    }

    draw(ctx: CanvasRenderingContext2D, _engine: GameEngine): void {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        ctx.globalAlpha = Math.max(0, this.alpha);

        // Background
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.fillStyle = "#e8e8e8";
        ctx.font = `bold ${W * 0.08}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("STEEP", W / 2, H * 0.35);

        // text
        const fontSize = W * 0.025;
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = "#888";

        const line1 = "A Zombie Survival";
        const line2 = "The world has fallen. You have not.";

        // Line 1
        ctx.fillText(line1, W / 2, H * 0.47);
        // Line 2 
        ctx.fillText(line2, W / 2, (H * 0.47) + fontSize + 10);

        // prompt
        const pulse = Math.abs(Math.sin(performance.now() / 600));
        ctx.globalAlpha = Math.max(0, this.alpha) * pulse;
        ctx.fillStyle = "#c0392b";
        ctx.font = `${W * 0.03}px monospace`;
        ctx.fillText("[ PRESS ENTER OR CLICK TO BEGIN ]", W / 2, H * 0.72);

        // Settings to make sure other entties isn't being affected
        ctx.globalAlpha = 1;
        ctx.textAlign = "left";
    }
}