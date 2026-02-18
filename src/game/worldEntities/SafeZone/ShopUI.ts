import { GameEngine } from "../../../engine/gameengine.js";
import { Vec2 } from "../../../engine/types.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity,  EntityID } from "../../../engine/Entity.js";
import { Player } from "../player.js";
import { AmmoRestore } from "../../Items/AmmoRestore.js";
import { InstantHealthItem } from "../../Items/InstantHealth.js";
import { ShieldRestorePickupItem } from "../../Items/ShieldRestore.js";
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
export class ShopUI implements Entity {
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
    private flashColor: string = "#FF4444";
    private flashTimer: number = 0;
    private readonly FLASH_DURATION = 1.5; 

    private items: ShopItem[] = [
        {
            id: "ammo",
            name: "AMMO REFILL",
            description: "RESTORES YOUR\nAMMUNITION TO\nFULL CAPACITY.",
            cost: 50,
            spritePath: "res/img/items/rifle.png",
            frameWidth: 43,
            frameHeight: 24,
        },
        {
            id: "health",
            name: "HEALTH PACK",
            description: "INSTANTLY HEALS\nYOU BACK TO\nFULL HEALTH.",
            cost: 100,
            spritePath: "res/img/items/instant_health_pickup.png",
            frameWidth: 42,
            frameHeight: 40,
        },
        {
            id: "shield",
            name: "SHIELD BOOST",
            description: "RESTORES SHIELD\nBY 25 POINTS.",
            cost: 150,
            spritePath: "res/img/items/shield_pickup.png",
            frameWidth: 54,
            frameHeight: 64,
        }
    ];

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    /**
     * Mapping the shop item ID to its corresponding Buff instance.
     */
    private createBuff(itemId: string): Buff | null {
        switch (itemId) {
            case "ammo":   return new AmmoRestore();
            case "health": return new InstantHealthItem();
            case "shield": return new ShieldRestorePickupItem();
            default:       return null;
        }
    }

    /**
     * Attempts to purchase an item, then it will returns true on success.
     */
    private tryPurchase(item: ShopItem): boolean {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) return false;

        if (player.currency < item.cost) {
            this.showFlash(`NOT ENOUGH GOLD! (Need ${item.cost}, have ${player.currency})`, "#FF4444");
            return false;
        }

        const buff = this.createBuff(item.id);
        if (!buff) return false;

        // Deduct currency and apply buff
        player.currency -= item.cost;
        buff.onApply();

        this.showFlash(`BOUGHT ${item.name}!`, "#44FF88");
        console.log(`Player bought ${item.name} for ${item.cost}. Remaining currency: ${player.currency}`);
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

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
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
        const borderDark = "#5C3A2E";
        const borderLight = "#C9A87C";
        const bgMain = "#D4A574";
        const cardBg = "#A67C52";
        const cardDark = "#8B5E3C";
        const textWhite = "#FFFFFF";
        const goldColor = "#F4D03F";

        // Panel Dimesions
        const cardH = h * 0.45;
        const panelH = 10 + 50 + 20 + cardH + 20;
        const panelW = w * 0.7;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;

        // Drawing Main Panel
        this.drawPixelPanel(ctx, panelX, panelY, panelW, panelH, borderDark, borderLight, bgMain);

        // Title Bar
        const titleBarH = 50;
        const titleBarY = panelY + 10;
        this.drawPixelPanel(ctx, panelX + 20, titleBarY, panelW - 40, titleBarH, cardDark, borderLight, cardBg);

        ctx.fillStyle = textWhite;
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.fillText("BUY SOMETHING!", w / 2, titleBarY + 35);

        // Setup to draw the items
        const itemsPerRow = 3;
        const cardMargin = 20;
        const cardSpacing = 15;
        const cardW = (panelW - (cardMargin * 2) - (cardSpacing * (itemsPerRow - 1))) / itemsPerRow;
        const cardsY = titleBarY + titleBarH + 20;

        // Setup to draw each item
        this.items.forEach((item, idx) => {
            const col = idx % itemsPerRow;
            const x = panelX + cardMargin + (col * (cardW + cardSpacing));
            const y = cardsY;

            item.rect = { x, y, w: cardW, h: cardH };

            // Determine if player can afford this item
            const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
            const canAfford = player ? player.currency >= item.cost : false;
            this.drawItemCard(ctx, game, item, x, y, cardW, cardH, cardBg, cardDark, borderLight, textWhite, goldColor, canAfford);
        });

        // Flash message overlay
        if (this.flashMessage && this.flashTimer > 0) {
            const alpha = Math.min(1, this.flashTimer / 0.3); //
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.flashColor;
            ctx.font = "bold 22px monospace";
            ctx.textAlign = "center";
            ctx.fillText(this.flashMessage, w / 2, panelY - 15);
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
        cardBg: string,
        cardDark: string,
        borderLight: string,
        textWhite: string,
        goldColor: string,
        canAfford: boolean  
    ) {
        // Dim card if can't afford
        if (!canAfford) ctx.globalAlpha = 0.55;
        // Card background
        this.drawPixelPanel(ctx, x, y, w, h, cardDark, borderLight, cardBg);

        // TEMP: THis sis where the image of the sprite goes
        const iconAreaH = h * 0.35;
        const iconY = y + 10;
        this.drawPixelPanel(ctx, x + 10, iconY, w - 20, iconAreaH, cardDark, borderLight, "#9B6F47");
        if (item.spritePath && item.frameWidth && item.frameHeight) {
            const sprite = game.getSprite(new ImagePath(item.spritePath));

            const maxSize = Math.min(w - 40, iconAreaH - 20);
            const scale = Math.min(maxSize / item.frameWidth, maxSize / item.frameHeight);

            const spriteW = item.frameWidth * scale;
            const spriteH = item.frameHeight * scale;
            const spriteX = x + w / 2 - spriteW / 2;
            const spriteY = iconY + iconAreaH / 2 - spriteH / 2;

            // Draw first frame of the sprite (0, 0, frameWidth, frameHeight from sprite sheet)
            ctx.drawImage(
                sprite,
                0, 0,  // Source x, y (first frame)
                item.frameWidth, item.frameHeight,  // Source width, height
                spriteX, spriteY,  // Destination x, y
                spriteW, spriteH   // Destination width, height (scaled)
            );
        } else {
            // Fallback to "?" if no sprite
            ctx.fillStyle = textWhite;
            ctx.font = "48px monospace";
            ctx.textAlign = "center";
            ctx.fillText("?", x + w / 2, iconY + iconAreaH / 2 + 15);
        }


        // Item Name
        const nameY = iconY + iconAreaH + 5;
        const nameBannerH = 35;
        this.drawPixelPanel(ctx, x + 10, nameY, w - 20, nameBannerH, cardDark, borderLight, cardDark);
        ctx.fillStyle = textWhite;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(item.name, x + w / 2, nameY + 22);

        // Item description 
        const descY = nameY + nameBannerH + 25;
        ctx.fillStyle = textWhite;
        ctx.font = "12px monospace";
        const lines = item.description.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, x + w / 2, descY + (i * 16));
        });

        // Gold Cost 
        const costY = y + h - 80;
        ctx.fillStyle = canAfford ? goldColor : "#AA8833";
        ctx.font = "bold 18px monospace";

        // Gold Coin
        const coinX = x + w / 2 - 25;
        ctx.beginPath();
        ctx.arc(coinX, costY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(item.cost.toString(), coinX + 30, costY + 5);

        // Buy Button
        const btnW = w - 20;
        const btnH = 35;
        const btnX = x + 10;
        const btnY = y + h - btnH - 10;
        item.buttonRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Button color: greyed out if can't afford
        const btnBg = canAfford ? "#A67C52" : "#5A4A3A";
        this.drawPixelButton(ctx, btnX, btnY, btnW, btnH, cardDark, borderLight, btnBg);
        ctx.fillStyle = canAfford ? textWhite : "#888888";
        ctx.font = "bold 18px monospace";
        ctx.fillText(canAfford ? "BUY" : "BROKE", x + w / 2, btnY + 23);
        ctx.textAlign = "left";

        // Reset alpha
        ctx.globalAlpha = 1;
    }


    /**
     * Private helper to draw the card format itself
     */
    private drawPixelPanel(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        borderDark: string,
        borderLight: string,
        bgColor: string
    ) {
        const borderSize = 4;

        // The background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);

        // Dark Outer border
        ctx.fillStyle = borderDark;
        ctx.fillRect(x + w - borderSize, y, borderSize, h);
        ctx.fillRect(x, y + h - borderSize, w, borderSize);

        // Light Outer border 
        ctx.fillStyle = borderLight;
        ctx.fillRect(x, y, w - borderSize, borderSize);
        ctx.fillRect(x, y, borderSize, h - borderSize);

        // Inner darker border
        const innerBorder = 2;
        ctx.fillStyle = borderDark;
        ctx.fillRect(x + borderSize, y + borderSize, w - borderSize * 2, innerBorder);
        ctx.fillRect(x + borderSize, y + borderSize, innerBorder, h - borderSize * 2);
    }

    /**
     * Private helper to draw the buy button itself
     */
    private drawPixelButton(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        borderDark: string,
        borderLight: string,
        bgColor: string
    ) {
        const borderSize = 3;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);

        // Border Top and Left
        ctx.fillStyle = borderLight;
        ctx.fillRect(x, y, w, borderSize);
        ctx.fillRect(x, y, borderSize, h);
        // Border right and bottom
        ctx.fillStyle = borderDark;
        ctx.fillRect(x + w - borderSize, y, borderSize, h);
        ctx.fillRect(x, y + h - borderSize, w, borderSize);
    }
}