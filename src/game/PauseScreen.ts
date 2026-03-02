import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { ForceDraw, Vec2 } from "../engine/types.js";

type MenuItem = {
    label: string;
    action: (game: GameEngine) => void;
};

export class PauseScreen extends ForceDraw implements Entity {
    readonly id: EntityID;
    readonly tag: string = "pause_screen";
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;

    // Keys flags
    private escWasPressed: boolean = false;
    private upWasPressed: boolean = false;
    private downWasPressed: boolean = false;
    private enterWasPressed: boolean = false;
    private selectedIndex: number = 0;

    // Transititon settings
    private fadeAlpha: number = 0;
    private readonly FADE_SPEED = 8; // alpha/sec

    private readonly MENU_ITEMS: MenuItem[] = [
        { label: "RESUME", action: (g) => this.close(g) },
        { label: "QUIT TO MENU", action: (_) => window.location.reload() },
    ];

    constructor() {
        super();
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    /**
     * Handles pause menu when open logic 
     */
    private open(game: GameEngine): void {
        this.selectedIndex = 0;
        this.fadeAlpha = 0;
        game.pause();
    }


    /**
     * Handles pause menu when close  logic 
     */
    private close(game: GameEngine): void {
        this.fadeAlpha = 0;
        game.resume();
    }

    update(keys: { [key: string]: boolean }, dt: number, _click: { x: number; y: number } | null, _mouse: { x: number; y: number } | null): void {
        const game = GameEngine.g_INSTANCE;

        // If game phase is in intro screen, dont show pause 
        if (game.getUniqueEntityByTag("intro_screen")) return;

        // Handles the different parts of the menu updates
        this.handlePauseToggle(keys, game, dt);
        this.handlePauseNav(keys);
        this.handleOptionSelection(keys, game);
    }

    /**
     * Toggle pause with escape 
     */
    handlePauseToggle(keys: { [key: string]: boolean }, game: GameEngine, dt: number) {
        // Toggle pause with ESC 
        const escDown = !!keys["Escape"];
        if (escDown && !this.escWasPressed) {
            if (game.isPaused()) {
                this.close(game);
            } else {
                this.open(game);
            }
        }

        this.escWasPressed = escDown;

        if (!game.isPaused()) return;

        // Animation fade in
        this.fadeAlpha = Math.min(1, this.fadeAlpha + this.FADE_SPEED * dt);
    }

    /**
     * Hanldes the pause menu navigation keys 
     */
    handlePauseNav(keys: { [key: string]: boolean }) {
        // Using arrow or WASD for pause menu nav
        const upDown = !!(keys["ArrowUp"] || keys["w"] || keys["W"]);
        if (upDown && !this.upWasPressed) {
            this.selectedIndex =
                (this.selectedIndex - 1 + this.MENU_ITEMS.length) % this.MENU_ITEMS.length;
        }
        this.upWasPressed = upDown;

        const downDown = !!(keys["ArrowDown"] || keys["s"] || keys["S"]);
        if (downDown && !this.downWasPressed) {
            this.selectedIndex = (this.selectedIndex + 1) % this.MENU_ITEMS.length;
        }
        this.downWasPressed = downDown;
    }

    /**
     * Handle when the player choose an option
     */
    handleOptionSelection(keys: { [key: string]: boolean }, game: GameEngine) {
        // Confirm by pressing enter
        const enterDown = !!(keys["Enter"] || keys[" "]);
        if (enterDown && !this.enterWasPressed) {
            this.MENU_ITEMS[this.selectedIndex].action(game);
        }
        this.enterWasPressed = enterDown;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // Safeguards if game is already intro screen or pause
        if (game.getUniqueEntityByTag("intro_screen")) return;
        if (!game.isPaused()) return;

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // Panel setting
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        const panelW = 490;  // Reduced from 520
        const panelH = 450;  // Reduced from 480
        const panelX = (W - panelW) / 2;
        const panelY = (H - panelH) / 2;

        // Drawing all the pieces for the pause menu
        this.drawPausePanel(ctx, W, H, panelX, panelY, panelW, panelH);
        this.drawPauseMenuTitle(ctx, W, panelY);
        this.drawDivier(ctx, panelX, panelY, panelW)
        this.drawPauseMenuOptions(ctx, W, panelY, panelX, panelW);
        this.drawFooterText(ctx, W, panelY, panelH);
        ctx.restore();
    }

    /**
     * Draw all the miscellainous and foundation of the pause menu
     */
    drawPausePanel(ctx: CanvasRenderingContext2D, W: number, H: number, panelX: number, panelY: number, panelW: number, panelH: number) {
        // A dim background of the menu
        ctx.fillStyle = "rgba(2, 6, 12, 0.82)";
        ctx.fillRect(0, 0, W, H);

        // Scanlines
        ctx.fillStyle = "rgba(0,0,0,0.07)";
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

        // A vignette
        const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // Shadow / glow behind panel
        ctx.save();
        ctx.shadowColor = `rgba(35,197,246,0.18)`;
        ctx.shadowBlur = 56;
        ctx.fillStyle = "rgba(6, 10, 18, 0.97)";
        this.drawRectangle(ctx, panelX, panelY, panelW, panelH, 12);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.save();
        ctx.strokeStyle = "rgba(35,197,246,0.14)";
        ctx.lineWidth = 2;
        this.drawRectangle(ctx, panelX, panelY, panelW, panelH, 12);
        ctx.stroke();
        ctx.restore();

        // That top bar
        ctx.fillStyle = "#23c5f6";
        ctx.fillRect(panelX + 12, panelY, panelW - 24, 4);
    }


    /**
     * Just draws the Pause Title on top of the pause scren
     */
    drawPauseMenuTitle(ctx: CanvasRenderingContext2D, W: number, panelY: number) {
        ctx.save();
        ctx.font = "bold 76px 'Bebas Neue', 'Share Tech Mono', monospace";
        ctx.fillStyle = "#d8edf6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(35,197,246,0.5)";
        ctx.shadowBlur = 24;
        ctx.fillText("PAUSED", W / 2, panelY + 98);
        ctx.restore();
    }

    /**
     * Drawing little divider between the pause title and pause menu options  
     */
    drawDivier(ctx: CanvasRenderingContext2D, panelX: number, panelY: number, panelW: number) {
        ctx.save();
        ctx.strokeStyle = "rgba(77,164,250,0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(panelX + 40, panelY + 162);
        ctx.lineTo(panelX + panelW - 40, panelY + 162);
        ctx.stroke();
        ctx.restore();

    }


    /**
     * Helps draw each of the options in the pause menu
     */
    drawPauseMenuOptions(ctx: CanvasRenderingContext2D, W: number, panelY: number, panelX: number, panelW: number) {
        const menuStartY = panelY + 220;
        const menuSpacing = 100;

        this.MENU_ITEMS.forEach((item, idx) => {
            const optionY = menuStartY + idx * menuSpacing;
            const selected = idx === this.selectedIndex;

            // Logic when selection 
            if (selected) {
                // Glow bg
                ctx.save();
                ctx.shadowColor = "rgba(35,197,246,0.45)";
                ctx.shadowBlur = 32;
                ctx.fillStyle = "rgba(35,197,246,0.10)";
                ctx.fillRect(panelX + 32, optionY - 32, panelW - 64, 64);
                ctx.restore();
                ctx.fillStyle = "#23c5f6";
                ctx.fillRect(panelX + 32, optionY - 32, 6, 64);
            }

            // menu options text 
            ctx.save();
            ctx.font = `${selected ? "bold" : "normal"} 30px 'Share Tech Mono', 'Courier New', monospace`;
            ctx.fillStyle = selected ? "#e8f6ff" : "rgba(160,200,220,0.35)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Text selected, change color
            if (selected) {
                ctx.shadowColor = "rgba(35,197,246,0.7)";
                ctx.shadowBlur = 16;
            }
            ctx.fillText(item.label, W / 2, optionY);
            ctx.restore();
        });
    }


    /**
     * Draws the bottom text of the pause menu
     */
    drawFooterText(ctx: CanvasRenderingContext2D, W: number, panelY: number, panelH: number) {
        ctx.save();
        ctx.font = "18px 'Share Tech Mono', 'Courier New', monospace";
        ctx.fillStyle = "rgba(180, 220, 255, 0.75)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("↑ ↓ NAVIGATE   ENTER CONFIRM   ESC RESUME", W / 2, panelY + panelH - 26);
        ctx.restore();
    }

    // Helpeer method to draw rectangle
    drawRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}