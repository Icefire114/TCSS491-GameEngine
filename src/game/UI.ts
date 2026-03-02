import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { ForceDraw, Vec2 } from "../engine/types.js";
import { clamp, unwrap } from "../engine/util.js";
import { Buff, BuffType, TempBuff } from "./Items/Buff.js";
import { ItemType } from "./Items/Item.js";
import { Player } from "./worldEntities/player.js";
import { ShopUI } from "./worldEntities/SafeZone/ShopUI.js";
import { ArmoryUI } from "./worldEntities/SafeZone/ArmoryUI.js";
import { G_CONFIG } from "./CONSTANTS.js";

// Constants used for Panel layout - MODERATELY INCREASED SIZES
const PANEL_W = 270;
const PANEL_H = 230;
const PANEL_PAD_X = 16;
const PANEL_PAD_TOP = 16;
const PANEL_MARGIN = 18;
const PANEL_RADIUS = 7;
const ROW_H = 42;
const BAR_H = 6;
const HUD_FONT = "'Share Tech Mono', 'Courier New', monospace";

export class UILayer extends ForceDraw implements Entity {
    readonly id: EntityID;
    readonly tag: string = "UI_LAYER";

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;
    drawEnterSZPrompt: boolean = false;
    drawOpenShopPrompt: boolean = false;
    drawOpenArmoryPrompt: boolean = false;
    drawExitSZPrompt: boolean = false;

    // Shop UI Properties
    private shop: ShopUI;
    private lWasPressed: boolean = false;

    // Armory UI Properties
    private armory: ArmoryUI;
    private pWasPressed: boolean = false;

    private m_healthBarEndCap: ImagePath = new ImagePath("res/img/ui/health_bar_endcap.png");
    private m_healthBarMidPiece: ImagePath = new ImagePath("res/img/ui/health_bar_midpiece.png");
    private m_healthBarStart: ImagePath = new ImagePath("res/img/ui/health_bar_startcap.png");
    private m_infBarEnd: ImagePath = new ImagePath("res/img/ui/infection_bar_end.png");
    private m_infBarMid: ImagePath = new ImagePath("res/img/ui/infection_bar_mid.png");
    private m_infBarStart: ImagePath = new ImagePath("res/img/ui/infection_bar_start.png");

    constructor(shop: ShopUI, armory: ArmoryUI) {
        super();
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.shop = shop;
        this.armory = armory;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // Doesnt draw anything unless Intros creen is gone
        if (game.getUniqueEntityByTag("intro_screen")) return;

        const player: Player = unwrap(game.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;

        ctx.save();

        // Drawing the different parts of UI 
        this.drawTempBuffs(ctx, game, player);
        this.drawHUDPanel(ctx, player);
        this.drawInteractionPrompt(ctx);

        if (this.shop.isOpen) {
            ctx.save();
            this.shop.draw(ctx, game);
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Drawing the temp buffs UI  
     */
    private drawTempBuffs(ctx: CanvasRenderingContext2D, game: GameEngine, player: Player): void {
        const tempBuffs = player.buffs.filter(
            (item) => item.type === BuffType.TEMP_BUFF
        ) as (Buff & TempBuff)[];

        // Draw TEMP_BUFFS in the top-right, 2% in from the left edge
        const margin = Math.round(ctx.canvas.width * 0.02);
        const iconSize = 40;
        const spacing = 6;
        const buffBarLen = 4;

        tempBuffs.forEach((buff, idx) => {
            const sprite: HTMLImageElement = game.getSprite(buff.sprite);
            const x = margin;
            const y = margin + idx * (iconSize + spacing);

            ctx.drawImage(sprite, x, y, iconSize, iconSize);
            ctx.fillStyle = "red";
            ctx.fillRect(x + iconSize * 1.33, y, (iconSize * buffBarLen) * (buff.currentDuration / buff.startingDuration), iconSize);
        });

        for (const item of player.items) {
            const sprite: HTMLImageElement = game.getSprite(item.sprite);
            const w = sprite.width;
            const h = sprite.height;
            ctx.save();
            switch (item.type) {
                case ItemType.GUN:
                    break;
            }
            ctx.restore();
        }
        this.drawPlayerHealthAndInfectionBar(ctx, player);
    }

    // Drawing the Hud Panel itself

    /**
     * Handles in drawing all the hud pieces together
     */
    private drawHUDPanel(ctx: CanvasRenderingContext2D, player: Player): void {
        // Panel Settings
        const panelW = ctx.canvas.width;
        const panelX = panelW - PANEL_W - PANEL_MARGIN;
        const panelY = PANEL_MARGIN;

        // Drawing all the parts and pieces for the panle
        this.drawPanelBackground(ctx, panelX, panelY);

        this.drawInfectionStat(ctx, player, panelX, panelY);
        this.drawHealthStat(ctx, player, panelX, panelY);
        this.drawAmmoStat(ctx, player, panelX, panelY);
        this.drawMagStat(ctx, player, panelX, panelY);
        this.drawCurrencyStat(ctx, player, panelX, panelY);
    }

    /**
     * Handles drawing the panel background looks 
     */
    private drawPanelBackground(ctx: CanvasRenderingContext2D, panelX: number, panelY: number): void {
        const panelRadius = PANEL_RADIUS;
        ctx.save();

        // panel drawing
        ctx.beginPath();
        ctx.moveTo(panelX + panelRadius, panelY);
        ctx.lineTo(panelX + PANEL_W - panelRadius, panelY);
        ctx.quadraticCurveTo(panelX + PANEL_W, panelY, panelX + PANEL_W, panelY + panelRadius);
        ctx.lineTo(panelX + PANEL_W, panelY + PANEL_H - panelRadius);
        ctx.quadraticCurveTo(panelX + PANEL_W, panelY + PANEL_H, panelX + PANEL_W - panelRadius, panelY + PANEL_H);
        ctx.lineTo(panelX + panelRadius, panelY + PANEL_H);
        ctx.quadraticCurveTo(panelX, panelY + PANEL_H, panelX, panelY + PANEL_H - panelRadius);
        ctx.lineTo(panelX, panelY + panelRadius);
        ctx.quadraticCurveTo(panelX, panelY, panelX + panelRadius, panelY);
        ctx.closePath();

        // The panel colors
        ctx.fillStyle = "rgba(8, 12, 16, 0.82)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // A bar on the top 
        ctx.fillStyle = "#4da4fa";
        ctx.fillRect(panelX + panelRadius, panelY, PANEL_W - panelRadius * 2, 3);

        ctx.restore();
    }

    private drawPlayerHealthAndInfectionBar(ctx: CanvasRenderingContext2D, player: Player): void {
        /// === Health Bar ===
        const endcapSprite = GameEngine.g_INSTANCE.getSprite(this.m_healthBarEndCap);
        const midSprite = GameEngine.g_INSTANCE.getSprite(this.m_healthBarMidPiece);
        const startSprite = GameEngine.g_INSTANCE.getSprite(this.m_healthBarStart);

        const playerHP = player.health;
        const playerHPPercent = playerHP / player.maxHealth;
        let neededMidPieces = Math.ceil(clamp(player.maxHealth / 10, 10, 60));

        ctx.drawImage(endcapSprite, ctx.canvas.width - 35, 15);
        ctx.drawImage(midSprite, ctx.canvas.width - 35 - endcapSprite.width, 15);
        for (let i = 1; i <= neededMidPieces; i++) {
            ctx.drawImage(midSprite, ctx.canvas.width - 35 - midSprite.width * i, 15);
        }
        ctx.drawImage(startSprite, ctx.canvas.width - 35 - midSprite.width * (neededMidPieces + 1), 15);

        // this is so fucking wrong, but it just works so im not touching it.
        const pixelsWeCanFill = (neededMidPieces - 1) * midSprite.width;
        ctx.fillStyle = "rgb(212, 0, 0)";
        ctx.fillRect(ctx.canvas.width - 19, 18, -1 * pixelsWeCanFill * playerHPPercent, 32);

        /// === Infection Bar ===
        const infection_bar_end = GameEngine.g_INSTANCE.getSprite(this.m_infBarEnd);
        const infection_bar_mid = GameEngine.g_INSTANCE.getSprite(this.m_infBarMid);
        const infection_bar_start = GameEngine.g_INSTANCE.getSprite(this.m_infBarStart);
        ctx.drawImage(infection_bar_end, ctx.canvas.width - 35, 55);
        ctx.drawImage(infection_bar_mid, ctx.canvas.width - 35 - infection_bar_end.width, 55);
        for (let i = 1; i < 10; i++) {
            ctx.drawImage(infection_bar_mid, ctx.canvas.width - 35 - infection_bar_mid.width * i, 55);
        }
        ctx.drawImage(infection_bar_start, ctx.canvas.width - 35 - (infection_bar_mid.width * 9) - infection_bar_start.width, 55);

        console.log(player.infection);

        const infBarPixelsWeCanFill = (infection_bar_end.width - 3 + (infection_bar_mid.width * 9) + (infection_bar_start.width - 43));
        const fillRatio = player.infection / player.maxInfection;
        const totalFill = infBarPixelsWeCanFill * fillRatio;

        const startX = ctx.canvas.width - 25;
        // ctx.fillStyle = "white";
        // ctx.fillRect(startX, 60, -infBarPixelsWeCanFill, 18);

        // Draw red segment (80%–100% zone)
        const redFill = Math.max(0, totalFill - infBarPixelsWeCanFill * 0.80);
        ctx.fillStyle = "red";
        ctx.fillRect(startX, 60, -redFill, 18);

        // Draw orange on top (50%–80% zone), overwriting red in that range
        const orangeFill = Math.min(totalFill, infBarPixelsWeCanFill * 0.80);
        ctx.fillStyle = "orange";
        ctx.fillRect(startX, 60, -orangeFill, 18);

        // Draw green on top (0%–50% zone)
        const greenFill = Math.min(totalFill, infBarPixelsWeCanFill * 0.50);
        ctx.fillStyle = "green";
        ctx.fillRect(startX, 60, -greenFill, 18);
    }

    // Drawing all the different stats

    /**
     * Draw the Infection stats  
     */
    private drawInfectionStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        let color: string;
        let barColor: string;

        // Change color depending on the infection level 
        if (player.infection < 50) {
            color = "#27ae60"; barColor = "#2ecc71";
        } else if (player.infection < 100) {
            color = "#f39c12"; barColor = "#f39c12";
        } else {
            color = "#e74c3c"; barColor = "#e74c3c";
        }

        // Drawing the stat itself 
        this.drawStatRow(ctx, panelX, panelY, 0, "☣", "Infection", `${player.infection}%`, color, {
            ratio: player.infection / 150,
            fill: barColor,
            background: "rgba(255,255,255,0.08)",
        });
    }

    /**
     * Drawing the health stats  
     */
    private drawHealthStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        const ratio = player.health / 100;
        let barColor;

        // COlor change logic
        if (ratio > 0.5) {
            barColor = "#e74c3c";
        } else if (ratio > 0.25) {
            barColor = "#e67e22";
        } else {
            barColor = "#c0392b";
        }

        this.drawStatRow(ctx, panelX, panelY, 1, "❤︎⁠", "Health", `${player.health}`, "#ff4b36", {
            ratio,
            fill: barColor,
            background: "rgba(255,255,255,0.08)",
        });
    }

    /**
     * Drawing the ammo stats  
     */
    private drawAmmoStat(ctx: CanvasRenderingContext2D, player: Player, px: number, py: number): void {
        this.drawStatRow(ctx, px, py, 2, "◈", "Ammo", `${player.weapon.ammoOnHand}`, "rgba(220,230,240,0.9)");
    }

    /**
     * Drawing the mag stats  
     */
    private drawMagStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        const ratio = player.weapon.ammoInGun / player.weapon.magSize;
        const lowAmmo = ratio <= 0.4;
        const color = lowAmmo ? "#f39c12" : "rgba(220,230,240,0.9)";
        const barFill = lowAmmo ? "#f39c12" : "rgba(180,200,220,0.7)";

        this.drawStatRow(
            ctx, panelX, panelY, 3, "▣", "Mag",
            `${player.weapon.ammoInGun} / ${player.weapon.magSize}`,
            color,
            { ratio, fill: barFill, background: "rgba(255,255,255,0.08)" }
        );
    }

    /**
     * Drawing the currency stats
     */
    private drawCurrencyStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        this.drawStatRow(ctx, panelX, panelY, 4, "◆", "Credits", `${player.currency}`, "#f1c40f");
    }

    /**
     * Helper method to draw the stats so i don't have to repeat the code style and format for each stats 
     */
    private drawStatRow(
        ctx: CanvasRenderingContext2D,
        panelX: number,
        panelY: number,
        rowIndex: number,
        statSymbol: string,
        label: string,
        value: string,
        valueColor: string,
        bar?: { ratio: number; fill: string; background: string }
    ): void {
        const rowY = panelY + PANEL_PAD_TOP + 14 + rowIndex * ROW_H;
        const rightX = panelX + PANEL_W - PANEL_PAD_X;

        // The icon for the stat
        ctx.save();
        ctx.font = `bold 20px ${HUD_FONT}`;
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(statSymbol, panelX + PANEL_PAD_X, rowY);
        ctx.restore();

        // Label
        ctx.save();
        ctx.font = `bold 13px ${HUD_FONT}`;
        ctx.fillStyle = "rgba(200,210,220,0.65)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label.toUpperCase(), panelX + PANEL_PAD_X + 26, rowY);
        ctx.restore();

        // Value
        ctx.save();
        ctx.font = `bold 18px ${HUD_FONT}`;
        ctx.fillStyle = valueColor;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(value, rightX, rowY);
        ctx.restore();

        // If stats need a bar 
        if (bar) {
            // Bar setting
            const barX = panelX + PANEL_PAD_X;
            const barY = rowY + 12;
            const barW = PANEL_W - PANEL_PAD_X * 2;
            const filled = Math.round(barW * Math.max(0, Math.min(1, bar.ratio)));

            // Drawing the bar out 
            ctx.save();
            ctx.fillStyle = bar.background;
            ctx.fillRect(barX, barY, barW, BAR_H);
            ctx.fillStyle = bar.fill;
            ctx.fillRect(barX, barY, filled, BAR_H);
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.fillRect(barX, barY, filled, 1.5);
            ctx.restore();
        }
    }

    /**
     * Hanldes the interaction Prompt 
     */
    private drawInteractionPrompt(ctx: CanvasRenderingContext2D): void {
        // The differnt types of prompts 
        const promptMap: Record<string, string> = {
            drawEnterSZPrompt: "Press  E  to enter the Safe Zone",
            drawOpenShopPrompt: "Press  E  to open / close the Shop",
            drawOpenArmoryPrompt: "Press  E  to open / close the Armory",
            drawExitSZPrompt: "Press  E  to exit the Safe Zone",
        };

        for (const [flag, text] of Object.entries(promptMap)) {
            if (!(this as any)[flag]) {
                continue;
            }
            this.drawPrompt(ctx, text);
            break; // Ensures that only one primpt at a time
        }
    }

    /**
     * Drawing the interactive prompt  
     */
    private drawPrompt(ctx: CanvasRenderingContext2D, text: string): void {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // Prompt Setting
        ctx.font = `bold 16px ${HUD_FONT}`;
        const textWdith = ctx.measureText(text).width;
        const promptH = 38;
        const promptW = textWdith + 38;
        const promptX = (W - promptW) / 2;
        const promptY = H - 64;

        // Prompt background
        ctx.save();
        ctx.fillStyle = "rgba(8,12,16,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.20)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect?.(promptX, promptY, promptW, promptH, 5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // The [E] key symbol drawing
        const keyW = 22;
        const keyH = 22;
        const keyX = promptX + 14;
        const keyY = promptY + (promptH - keyH) / 2;
        ctx.save();
        ctx.fillStyle = "#4da4fa";
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.fillRect(keyX, keyY, keyW, keyH);
        ctx.strokeRect(keyX, keyY, keyW, keyH);
        ctx.font = `bold 14px ${HUD_FONT}`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("E", keyX + keyW / 2, keyY + keyH / 2);
        ctx.restore();

        // Drawing the prompt text itself
        const shortText = text.replace(/Press\s+E\s+to\s+/i, "to ");
        ctx.save();
        ctx.font = `bold 15px ${HUD_FONT}`;
        ctx.fillStyle = "rgba(220,230,240,0.90)";

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(shortText, keyX + keyW + 10, promptY + promptH / 2);
        ctx.restore();
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, clickCoords: Vec2, mouse: Vec2 | null): void { }
}
