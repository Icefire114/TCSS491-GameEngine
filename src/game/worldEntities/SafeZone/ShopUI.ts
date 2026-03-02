import { GameEngine } from "../../../engine/gameengine.js";
import { ForceDraw } from "../../../engine/types.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { Player } from "../player.js";
import { AmmoRestore } from "../../Items/AmmoRestore.js";
import { InstantHealthPickupBuff } from "../../Items/InstantHealthPickupBuff.js";
import { ShieldRestorePickupItem } from "../../Items/ShieldBoost.js";
import { Buff } from "../../Items/Buff.js";

interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    spritePath?: string;
    frameWidth?: number;
    frameHeight?: number;
    rect?: { x: number, y: number, w: number, h: number };
    buttonRect?: { x: number, y: number, w: number, h: number };
}

/**
 * Class that represents the Shop UI
 */
export class ShopUI extends ForceDraw implements Entity {
    tag: string = "shop_ui";
    id: EntityID;
    position: Vec2 = new Vec2(0, 0);
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider = null;
    sprite = null;
    removeFromWorld: boolean = false;
    public isOpen: boolean = false;

    // Flash message when buying
    private flashMessage: string | null = null;
    private flashColor: string = "#FF5555";
    private flashTimer: number = 0;
    private readonly FLASH_DURATION = 1.5;

    private items: ShopItem[] = [
        {
            id: "ammo",
            name: "AMMO REFILL",
            description: "Restores ammunition\nto full capacity.",
            cost: 50,
            spritePath: "res/img/items/rifle.png",
            frameWidth: 43,
            frameHeight: 24,
        },
        {
            id: "health",
            name: "HEALTH PACK",
            description: "Instantly heals you\nback to full health.",
            cost: 100,
            spritePath: "res/img/items/instant_health_pickup.png",
            frameWidth: 42,
            frameHeight: 40,
        },
        {
            id: "shield",
            name: "SHIELD BOOST",
            description: "Boots max health\nby 25 points.",
            cost: 150,
            spritePath: "res/img/items/shield_pickup.png",
            frameWidth: 54,
            frameHeight: 64,
        },
    ];

    constructor() {
        super();
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    /**
     * Mapping the shop item ID to its corresponding Buff instance.
     */
    private createBuff(itemId: string): Buff | null {
        switch (itemId) {
            case "ammo": return new AmmoRestore();
            case "health": return new InstantHealthPickupBuff();
            case "shield": return new ShieldRestorePickupItem();
            default: return null;
        }
    }

    /**
     * Attempts to purchase an item, then it will returns true on success.
     */
    private tryPurchase(item: ShopItem): boolean {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) return false;

        if (player.currency < item.cost) {
            this.showFlash(`Not enough currency — need ${item.cost}`, "#FF5555");
            return false;
        }

        const buff = this.createBuff(item.id);
        if (!buff) return false;

        // Deduct currency and apply buff
        player.currency -= item.cost;
        buff.onApply();

        this.showFlash(`Acquired: ${item.name}`, "#4DFFB4");
        return true;
    }

    private showFlash(message: string, color: string): void {
        this.flashMessage = message;
        this.flashColor = color;
        this.flashTimer = this.FLASH_DURATION;
    }

    /**
     * Handling the click logic (checks if any button was hit)
     */
    handleClick(canvasX: number, canvasY: number): void {
        if (!this.isOpen) return;

        for (const item of this.items) {
            if (!item.buttonRect) continue;
            const { x, y, w, h } = item.buttonRect;
            if (canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h) {
                this.tryPurchase(item);
                return;
            }
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords?: Vec2 | null,): void {
        // Route clicks to shop UI when open
        if (this.isOpen && clickCoords) {
            this.handleClick(clickCoords.x, clickCoords.y);
        }


        // For the flash message
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.flashMessage = null;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine) {
        if (!this.isOpen) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Color scheme of the UI
        const BG = "#1a2030";
        const SURFACE = "#212840";
        const BORDER = "#3a4e66";
        const ACCENT = "#5aafdf";
        const TEXT = "#eef4fa";
        const TEXT_DIM = "#7a96aa";
        const GOLD = "#f5c842";
        const GREEN = "#4deba0";
        const RED = "#f06060";
        const SEP = "#2a3a50";

        // UI Backdrop
        ctx.fillStyle = "rgba(4, 7, 12, 0.52)";
        ctx.fillRect(0, 0, w, h);

        // Panel Dimesions
        const cardH = Math.min(h * 0.48, 280);
        const panelW = Math.min(w * 0.70, 740);
        const headerH = 56;
        const panelH = headerH + 16 + cardH + 16;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;

        // Panel background and border
        ctx.fillStyle = BG;
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

        // A blue strip line on top 
        ctx.fillStyle = ACCENT;
        ctx.fillRect(panelX, panelY, panelW, 2);

        // The header
        ctx.fillStyle = SURFACE;
        ctx.fillRect(panelX, panelY + 2, panelW, headerH - 2);

        // A sepearte between  under header
        ctx.fillStyle = SEP;
        ctx.fillRect(panelX, panelY + headerH, panelW, 1);

        // The title
        ctx.fillStyle = TEXT;
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "left";
        ctx.fillText("SUPPLY SHOP", panelX + 20, panelY + 28);

        // The Shop Info 
        ctx.fillStyle = ACCENT;
        ctx.font = "13px monospace";
        ctx.fillText("SAFE ZONE  ·  ZONE 1", panelX + 20, panelY + 47);

        // Player currency (top-right of header)
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        const currency = player ? player.currency : 0;
        ctx.textAlign = "right";
        ctx.fillStyle = GOLD;
        ctx.font = "bold 18px monospace";
        ctx.fillText(`◆ ${currency}`, panelX + panelW - 20, panelY + 33);
        ctx.fillStyle = TEXT_DIM;
        ctx.font = "12px monospace";
        ctx.fillText("CURRENCY", panelX + panelW - 20, panelY + 49);

        // The Items cards
        const GAP = 10;
        const MARGIN = 16;
        const COLS = 3;
        const CARD_W = (panelW - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
        const cardsY = panelY + headerH + 16;

        this.items.forEach((item, i) => {
            const cx = panelX + MARGIN + i * (CARD_W + GAP);
            item.rect = { x: cx, y: cardsY, w: CARD_W, h: cardH };
            const canAfford = player ? player.currency >= item.cost : false;
            this.drawItemCard(ctx, game, item, cx, cardsY, CARD_W, cardH,
                SURFACE, BORDER, SEP, ACCENT, TEXT, TEXT_DIM, GOLD, GREEN, RED, canAfford);
        });

        // The flash message to pop up 
        if (this.flashMessage && this.flashTimer > 0) {
            const alpha = Math.min(1, this.flashTimer / 0.4);
            ctx.globalAlpha = alpha;
            ctx.textAlign = "center";
            ctx.font = "bold 15px monospace";
            ctx.fillStyle = this.flashColor;
            ctx.fillText(this.flashMessage, w / 2, panelY - 14);
            ctx.globalAlpha = 1;
        }
    }


    /**
     * Private method to draw each indvidual card 
     */
    private drawItemCard(
        ctx: CanvasRenderingContext2D,
        game: GameEngine,
        item: ShopItem,
        x: number,
        y: number,
        w: number,
        h: number,
        bg: string,
        border: string,
        sep: string,
        accent: string,
        textMain: string,
        textDim: string,
        gold: string,
        green: string,
        red: string,
        canAfford: boolean
    ) {
        // Dim card if can't afford
        ctx.globalAlpha = canAfford ? 1 : 0.5;

        // Card background + border
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = canAfford ? border : sep;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        // The left bar
        ctx.fillStyle = canAfford ? accent : sep;
        ctx.fillRect(x, y, 2, h);

        // Icons
        const iconH = Math.floor(h * 0.40);
        const iconY = y + 12;
        const iconPad = 10;

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x + iconPad, iconY, w - iconPad * 2, iconH);

        if (item.spritePath && item.frameWidth && item.frameHeight) {
            const sprite = game.getSprite(new ImagePath(item.spritePath));
            const maxSize = Math.min(w - iconPad * 2 - 16, iconH - 16);
            const scale = Math.min(maxSize / item.frameWidth, maxSize / item.frameHeight);
            const sw = item.frameWidth * scale;
            const sh = item.frameHeight * scale;
            ctx.drawImage(
                sprite, 0, 0, item.frameWidth, item.frameHeight,
                x + w / 2 - sw / 2,
                iconY + iconH / 2 - sh / 2,
                sw, sh
            );
        } else {
            ctx.fillStyle = textDim;
            ctx.font = "28px monospace";
            ctx.textAlign = "center";
            ctx.fillText("?", x + w / 2, iconY + iconH / 2 + 10);
        }

        // Items name ttiel 
        const nameY = iconY + iconH + 16;
        ctx.fillStyle = textMain;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(item.name, x + w / 2, nameY);

        // A sepearter (thin)
        ctx.fillStyle = sep;
        ctx.fillRect(x + iconPad, nameY + 8, w - iconPad * 2, 1);

        // Item Info 
        const descY = nameY + 22;
        ctx.fillStyle = textDim;
        ctx.font = "11px monospace";
        item.description.split("\n").forEach((line, i) => {
            ctx.fillText(line, x + w / 2, descY + i * 16);
        });

        // Cost of item
        const costY = y + h - 50;
        ctx.fillStyle = canAfford ? gold : "#7a6020";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`◆ ${item.cost}`, x + w / 2, costY);

        // The buy button
        const btnH = 32;
        const btnPad = 10;
        const btnX = x + btnPad;
        const btnY = y + h - btnH - 8;
        const btnW = w - btnPad * 2;
        item.buttonRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        if (canAfford) {
            ctx.fillStyle = "rgba(77, 235, 160, 0.15)";
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = green;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
            ctx.fillStyle = green;
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.fillText("BUY", x + w / 2, btnY + 21);
        } else {
            ctx.fillStyle = "rgba(240, 96, 96, 0.10)";
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = "#5a2020";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
            ctx.fillStyle = red;
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.fillText("BROKE", x + w / 2, btnY + 21);
        }

        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
    }
}