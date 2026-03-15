import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { ForceDraw } from "../engine/types.js";
import { Vec2 } from "../engine/Vec2.js";
import { clamp, unwrap } from "../engine/util.js";
import { Buff, BuffType, TempBuff } from "./Items/Buff.js";
import { ItemType } from "./Items/Item.js";
import { Player } from "./worldEntities/player.js";
import { ShopUI } from "./worldEntities/SafeZone/ShopUI.js";
import { ArmoryUI } from "./worldEntities/SafeZone/ArmoryUI.js";
import { G_CONFIG } from "./CONSTANTS.js";

// Constants used for Panel layout
const PANEL_W = 270;
const PANEL_H = 230;
const PANEL_PAD_X = 16;
const PANEL_PAD_TOP = 16;
const PANEL_MARGIN = 18;
const PANEL_RADIUS = 7;
const ROW_H = 42;
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

    // Phalen UI Inspo
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
        // this.drawPlayerHealthAndInfectionBar(ctx, player);
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

        this.drawHealthStat(ctx, player, panelX, panelY);
        this.drawInfectionStat(ctx, player, panelX, panelY);
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
        ctx.fillStyle = "rgba(10, 18, 32, 0.88)";
        ctx.fill();

        // Subtle inner edge
        const grad = ctx.createLinearGradient(panelX, panelY, panelX + PANEL_W, panelY + PANEL_H);
        grad.addColorStop(0, "rgba(77, 164, 250, 0.06)");
        grad.addColorStop(0.5, "rgba(0,   0,   0,   0.00)");
        grad.addColorStop(1, "rgba(0, 210, 255, 0.04)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Blue-tinted border
        ctx.strokeStyle = "rgba(77, 164, 250, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // A bar on the top 
        const topGrad = ctx.createLinearGradient(panelX + panelRadius, panelY, panelX + PANEL_W - panelRadius, panelY);
        topGrad.addColorStop(0, "#00c6ff");
        topGrad.addColorStop(0.5, "#4da4fa");
        topGrad.addColorStop(1, "#0072ff");
        ctx.fillStyle = topGrad;
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
     * Drawing the health stats — UNCHANGED
     */
    private drawHealthStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        const ratio = player.health / player.maxHealth;

        this.drawStatRow(ctx, panelX, panelY, 0, "❤︎⁠", "HP", "", "", {
            ratio,
            fill: "#e74c3c",
            background: "#000000",
            inline: true,
            labelColor: "rgba(180, 40, 40, 0.85)"
        });
    }

    /**
     * Drawing the health stats  
     */
    private drawInfectionStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        this.drawStatRow(ctx, panelX, panelY, 1, "☣", "INF", "", "", {
            ratio: player.infection / player.maxInfection,
            isInfection: true,
            background: "#000000",
            inline: true,
            labelColor: "rgba(39, 174, 96, 0.85)"
        });
    }

    /**
     * Drawing the ammo stats  
     */
    private drawAmmoStat(ctx: CanvasRenderingContext2D, player: Player, px: number, py: number): void {
        this.drawStatRow(ctx, px, py, 2, "◈", "Ammo", `${player.weapon.ammoOnHand}`, "#00d4ff", {
            ratio: 1,
            fill: "transparent",
            background: "transparent",
            labelColor: "rgba(0, 200, 240, 0.85)"
        });
    }

    /**
     * Drawing the mag stats  
     */
    private drawMagStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        this.drawStatRow(
            ctx, panelX, panelY, 3, "▣", "Mag",
            `${player.weapon.ammoInGun} / ${player.weapon.magSize}`,
            "#7ec8e3",
            {
                ratio: 1,
                fill: "transparent",
                background: "transparent",
                labelColor: "rgba(100, 180, 220, 0.85)"
            }
        );
    }

    /**
     * Drawing the currency stats
     */
    private drawCurrencyStat(ctx: CanvasRenderingContext2D, player: Player, panelX: number, panelY: number): void {
        // Gold label + value
        this.drawStatRow(ctx, panelX, panelY - 2, 4, "◆", "Credits", `${player.currency}`, "#ffd700", {
            ratio: 1,
            fill: "transparent",
            background: "transparent",
            labelColor: "rgba(220, 170, 0, 0.85)"
        });
    }

    /**
     * Helper method to draw a stat row
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
        bar?: { ratio: number; fill?: string; isInfection?: boolean; background: string; inline?: boolean; labelColor?: string; symbolColor?: string }
    ): void {
        const rowY = panelY + PANEL_PAD_TOP + 14 + rowIndex * ROW_H;
        const rightX = panelX + PANEL_W - PANEL_PAD_X;

        const customColor = bar && bar.labelColor ? bar.labelColor : null;

        // Icon
        ctx.save();
        ctx.font = `bold 22px ${HUD_FONT}`;
        ctx.fillStyle = customColor || "rgba(255,255,255,0.30)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(statSymbol, panelX + PANEL_PAD_X, rowY);
        ctx.restore();

        // Label — now uses the stat's own accent color
        ctx.save();
        ctx.font = `bold 20px ${HUD_FONT}`;
        ctx.fillStyle = customColor || "rgba(200,210,220,0.65)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label.toUpperCase(), panelX + PANEL_PAD_X + 26, rowY);
        ctx.restore();

        // Value
        if (value !== "") {
            ctx.save();
            ctx.font = `bold 18px ${HUD_FONT}`;
            ctx.fillStyle = valueColor;
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(value, rightX, rowY);
            ctx.restore();
        }

        // Bar
        if (bar && bar.fill !== "transparent") {
            let barX, barY, barW, barH;

            if (bar.inline) {
                barX = panelX + PANEL_PAD_X + 65;
                barY = rowY - 15;
                barW = PANEL_W - PANEL_PAD_X * 2 - 65;
                barH = 25;
            } else {
                barX = panelX + PANEL_PAD_X;
                barY = rowY + 16;
                barW = PANEL_W - PANEL_PAD_X * 2;
                barH = 6;
            }

            const totalFill = Math.round(barW * Math.max(0, Math.min(1, bar.ratio)));

            ctx.save();

            // Background track
            ctx.fillStyle = bar.background;
            ctx.fillRect(barX, barY, barW, barH);

            // Segmented infection bar
            if (bar.isInfection) {
                const greenFill = Math.min(totalFill, barW * 0.50);
                ctx.fillStyle = "#2ecc71";
                ctx.fillRect(barX, barY, greenFill, barH);

                if (totalFill > barW * 0.50) {
                    const orangeFill = Math.min(totalFill - barW * 0.50, barW * 0.30);
                    ctx.fillStyle = "#f39c12";
                    ctx.fillRect(barX + barW * 0.50, barY, orangeFill, barH);
                }

                if (totalFill > barW * 0.80) {
                    const redFill = Math.min(totalFill - barW * 0.80, barW * 0.20);
                    ctx.fillStyle = "#e74c3c";
                    ctx.fillRect(barX + barW * 0.80, barY, redFill, barH);
                }
            }
            // Normal solid bar
            else if (bar.fill) {
                ctx.fillStyle = bar.fill;
                ctx.fillRect(barX, barY, totalFill, barH);
            }

            // Highlight top edge
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.fillRect(barX, barY, totalFill, 1.5);
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
        const textWidth = ctx.measureText(text).width;
        const promptH = 38;
        const promptW = textWidth + 38;
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
