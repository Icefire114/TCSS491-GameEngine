import { GameEngine } from "../engine/gameengine.js";
import { Vec2 } from "../engine/types.js";
import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { AssultRifle } from "./Items/guns/AssultRifle.js";
import { RPG } from "./Items/guns/RPG.js";
import { RayGun } from "./Items/guns/RayGun.js";

interface ArmoryItem {
    id: string;
    name: string;
    description: string;
    availability: String;
    spritePath?: string;
    frameWidth?: number;
    frameHeight?: number;
    rect?: { x: number, y: number, w: number, h: number };
    buttonRect?: { x: number, y: number, w: number, h: number };
}

interface ArmoryItemStats {
    id: string;
    damage: number;
    fireRate: number;
    reloadTime: number;
    magSize: number;
    ammoSpritePath: string;
    frameWidth?: number;
    frameHeight?: number;
}

/**
 * Class that represents the Armory UI
 */
export class ArmoryUI implements Entity {

    //UI Colors
    
    static BORDER_DARK = "#211f1f";
    static BORDER_LIGHT = "#8b8b8a";
    static BG_MAIN = "#252320";
    static CARD_BG = "#000000";
    static CARD_DARK = "#3a3a3a";
    static TEXT_COLOR = "#FFFFFF";
    static BG2_MAIN = "#9B6F47";
    static GOLD = "#F4D03F";
    static STATS_BAR_EMPTY = "#4e4e4e";
    static STATS_BAR_FILL = "#ffffff";
    static STATS_BAR_BORDER = "#ff0000";

    tag: string = "armory_ui";
    id: EntityID;
    position: Vec2 = new Vec2(0, 0);
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider = null;
    sprite = null;
    removeFromWorld: boolean = false;
    public isOpen: boolean = false;
    //private selectedItemId: string | null = null;

    // List of all items
    private items: ArmoryItem[] = [
        {
            id: AssultRifle.tag,
            name: "Assult Rifle",
            description: "AN ALL AROUND SOLID WEAPON,\n GOOD FOR MOST SITUATIONS.",
            availability: "UNLOCKED",
            spritePath: "res/img/items/rifle.png",
            frameWidth: 42,
            frameHeight: 16,
        },
        {
            id: RPG.tag,
            name: "RPG",
            description: "A HIGH DAMAGE EXPLOSIVE WEAPON, \nBEST USED FOR GROUPS OF ENEMIES.",
            availability: "LOCKED",
            spritePath: "res/img/items/rpg.png",
            frameWidth: 47,
            frameHeight: 11,
        },
        {
            id: RayGun.tag,
            name: "Ray Gun",
            description: "A HIGH DAMAGE LASER WEAPON, \nBEST FOR SHREDDING \nTHROUGH ENEMIES QUICKLY.",
            availability: "LOCKED",
            spritePath: "res/img/items/ray_gun.png",
            frameWidth: 38,
            frameHeight: 15,
        }
    ];

    // list item stats
    private itemsStats: ArmoryItemStats[] = [
        {
            id: AssultRifle.tag,
            damage: AssultRifle.damage,
            fireRate: AssultRifle.fireRate,
            reloadTime: AssultRifle.reloadTime,
            magSize: AssultRifle.magSize,
            ammoSpritePath: "res/img/ammo/RifleBullet.png",
            frameWidth: 360,
            frameHeight: 121,
        }
    ];

    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine) {
        if (!this.isOpen) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        

        // Panel Dimesions
        const cardH = h * 0.45;
        const panelH = 10 + 50 + 20 + cardH + 20;
        const panelW = w * 0.5;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;

        // Drawing Main Panel
        this.drawPixelPanel(ctx, panelX, panelY, panelW, panelH, ArmoryUI.BORDER_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.BG_MAIN);

        // Title Bar
        const titleBarH = 50;
        const titleBarY = panelY + 10;
        this.drawPixelPanel(ctx, panelX + 20, titleBarY, panelW - 40, titleBarH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.CARD_BG);

        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.fillText("ARMORY", w / 2, titleBarY + 35);

        // Setup to draw the items
        // const itemsPerRow = 3;
        const cardMargin = 20;
        // const cardSpacing = 15;
        //const cardW = (panelW - (cardMargin * 2) - (cardSpacing * (itemsPerRow - 1))) / itemsPerRow;
        const cardW = (panelW * 0.6 - (cardMargin * 2));
        const cardsY = titleBarY + titleBarH + 20;

        // Setup to draw each item
        // this.items.forEach((item, idx) => {
            //const col = idx % itemsPerRow;
            //const x = panelX + cardMargin + (col * (cardW + cardSpacing));
            const x = panelX + cardMargin;
            const y = cardsY;

            this.items[0].rect = { x, y, w: cardW, h: cardH };
            // Drawing the card itself 
            this.drawItemCard(ctx, game, this.items[0], x, y, cardW, cardH);
        // });

        // setup weapon stats
        const statsW = (panelW * 0.4 - (cardMargin * 2));
        
        const statsX = panelX + cardMargin + cardW + cardMargin;
        const statsY = cardsY;

        this.drawItemStats(ctx, game, this.itemsStats[0], statsX, statsY, statsW, cardH);
        
    }

    private drawItemStats(
        ctx: CanvasRenderingContext2D,
        game: GameEngine,
        itemStats: ArmoryItemStats,
        x: number,
        y: number,
        w: number,
        h: number,
    ) {

        // draw background
        this.drawPixelPanel(ctx, x, y, w, h, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.CARD_BG);

        // Title
        const titleH = 40;
        this.drawPixelPanel(ctx, x + 10, y + 10, w - 20, titleH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.BG2_MAIN);
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "left";
        ctx.fillText("STATS", x + 20, y + 10 + 28);

        //graphic next to title
        const iconAreaH = h * 0.2;
        const iconY = y;
        //this.drawPixelPanel(ctx, x + 10, iconY, w - 20, iconAreaH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, "#9B6F47");
        if (itemStats.ammoSpritePath && itemStats.frameWidth && itemStats.frameHeight) {
            const sprite = game.getSprite(new ImagePath(itemStats.ammoSpritePath));

            const maxSize = Math.min(w / 2, iconAreaH);
            const scale = Math.min(maxSize / itemStats.frameWidth, maxSize / itemStats.frameHeight);

            const spriteW = itemStats.frameWidth * scale;
            const spriteH = itemStats.frameHeight * scale;
            const spriteX = x + w - spriteW - 20;
            const spriteY = iconY + iconAreaH / 2 - spriteH / 2;

            // Draw first frame of the sprite (0, 0, frameWidth, frameHeight from sprite sheet)
            ctx.drawImage(
                sprite,
                0, 0,  // Source x, y (first frame)
                itemStats.frameWidth, itemStats.frameHeight,  // Source width, height
                spriteX, spriteY,  // Destination x, y
                spriteW, spriteH   // Destination width, height (scaled)
            );
        } else {
            // Fallback to "?" if no sprite
            ctx.fillStyle = ArmoryUI.TEXT_COLOR;
            ctx.font = "48px monospace";
            ctx.textAlign = "center";
            ctx.fillText("?", x + w / 2, iconY + iconAreaH / 2 + 15);
        }

        this.drawStatsBar(ctx, x + 10, y + 70, w - 25, 30, "Damage", itemStats.damage, 100);
        this.drawStatsBar(ctx, x + 10, y + 120, w - 25, 30, "Fire Rate", itemStats.fireRate, 20);
        this.drawStatsBar(ctx, x + 10, y + 170, w - 25, 30, "Reload Time", itemStats.reloadTime, 3);
        this.drawStatsBar(ctx, x + 10, y + 220, w - 25, 30, "Magazine Size", itemStats.magSize, 100);
    }

    private drawStatsBar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        value: number,
        maxValue: number
    ) {
        // Draw label
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 5, y);

        // Draw value bar background
        ctx.fillStyle = ArmoryUI.STATS_BAR_EMPTY;
        ctx.fillRect(x, y + 5, w - 1, h - 19);

        // Draw value bar fill
        const fillW = (value / maxValue) * w - 3;
        ctx.fillStyle = ArmoryUI.STATS_BAR_FILL;
        ctx.fillRect(x + 2, y + 7, fillW, h - 22);

        // Draw value bar border
        ctx.strokeStyle = ArmoryUI.STATS_BAR_BORDER;
        ctx.strokeRect(x + 1, y + 6, w - 1, h - 20);

        for (let i = 1; i < 5; i++) {
            const tickX = x + (i * w / 5);
            ctx.strokeStyle = ArmoryUI.STATS_BAR_BORDER;
            ctx.beginPath();
            ctx.moveTo(tickX, y + 5);
            ctx.lineTo(tickX, y + h - 15);
            ctx.stroke();
        }

        // draw tick labels
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        for (let i = 0; i <= 5; i++) {
            const tickX = x + (i * w / 5);
            let tickValue = (i / 5) * maxValue;
            if (tickValue - Math.floor(tickValue) !== 0) {
                tickValue = parseFloat(tickValue.toFixed(1)); // show 1 decimal place if not whole number
            };
            ctx.fillText(tickValue.toString(), tickX, y + h - 5);
        }
    }    

    /**
     * Private method to draw each indvidual card 
     */
    private drawItemCard(
        ctx: CanvasRenderingContext2D,
        game: GameEngine,
        item: ArmoryItem,
        x: number,
        y: number,
        w: number,
        h: number,
    ) {
        // Card background
        this.drawPixelPanel(ctx, x, y, w, h, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.CARD_BG);

        // TEMP: THis sis where the image of the sprite goes
        const iconAreaH = h * 0.35;
        const iconY = y + 10;
        this.drawPixelPanel(ctx, x + 10, iconY, w - 20, iconAreaH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.BG2_MAIN);
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
            ctx.fillStyle = ArmoryUI.TEXT_COLOR;
            ctx.font = "48px monospace";
            ctx.textAlign = "center";
            ctx.fillText("?", x + w / 2, iconY + iconAreaH / 2 + 15);
        }


        // Item Name
        const nameY = iconY + iconAreaH + 5;
        const nameBannerH = 35;
        this.drawPixelPanel(ctx, x + 10, nameY, w - 20, nameBannerH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, ArmoryUI.CARD_DARK);
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(item.name, x + w / 2, nameY + 22);

        // Item description 
        const descY = nameY + nameBannerH + 25;
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "12px monospace";
        const lines = item.description.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, x + w / 2, descY + (i * 16));
        });

        // Gold Cost 
        const availableY = y + h - 80;
        ctx.fillStyle = ArmoryUI.GOLD;
        ctx.font = "bold 18px monospace";

        // Gold Coin
        const availableX = x + w / 2 - 25;
        ctx.fillText(item.availability.toString(), availableX + 30, availableY + 5);

        // Buy Button
        const btnW = w - 20;
        const btnH = 35;
        const btnX = x + 10;
        const btnY = y + h - btnH - 10;
        item.buttonRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        this.drawPixelButton(ctx, btnX, btnY, btnW, btnH, ArmoryUI.CARD_DARK, ArmoryUI.BORDER_LIGHT, "#A67C52");
        ctx.fillStyle = ArmoryUI.TEXT_COLOR;
        ctx.font = "bold 18px monospace";
        ctx.fillText("Select", x + w / 2, btnY + 23);
        ctx.textAlign = "left";
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
     * Private helper to draw the select button itself
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