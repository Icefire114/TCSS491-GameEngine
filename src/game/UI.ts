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
        // Collect TEMP_BUFFS
        const tempBuffs: (Buff & TempBuff)[] = player.buffs.filter(
            (item) => item.type === BuffType.TEMP_BUFF
        ) as (Buff & TempBuff)[];

        // Draw TEMP_BUFFS in the top-right, 2% in from the left edge
        const margin = Math.round(ctx.canvas.width * 0.02);
        const iconSize = 32; // adjust to your sprite size
        const spacing = 4;
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
                // TODO: Find a better place to display these to the user (in a safe zone?)
                case ItemType.GUN:
                    break;
            }
            ctx.restore();
        }

        this.drawPlayerHealthAndInfectionBar(ctx, player);

        // draw total player weapon ammo below shield
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText(`Ammo: ${player.weapon.ammoOnHand}`, ctx.canvas.width - 200, 120);
        //console.log(`Player Total Ammo: ${player.ammoOnHand}`);

        // draw mag count below shield
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText(`Mag: ${player.weapon.ammoInGun}/${player.weapon.magSize}`, ctx.canvas.width - 200, 160);
        //console.log(`Player Ammo: ${player.ammo}`);

        // draw currency below ammo
        ctx.fillStyle = "gold";
        ctx.font = "30px Arial";
        ctx.fillText(`Currency: ${player.currency}`, ctx.canvas.width - 200, 200);
        //console.log(`Player Currency: ${player.currency}`);

        // Shop UI Drawing
        if (this.shop.isOpen) {
            ctx.save();
            this.shop.draw(ctx, game);
            ctx.restore();
        }

        if (this.drawEnterSZPrompt) {
            ctx.fillStyle = "black"
            ctx.fillText("Press E to enter the Safe Zone", ctx.canvas.width / 2, ctx.canvas.height - 30);
        } else if (this.drawOpenShopPrompt) {
            ctx.fillStyle = "black"
            ctx.fillText("Press E to open/ close the Shop", ctx.canvas.width / 2, ctx.canvas.height - 30);
        } else if (this.drawOpenArmoryPrompt) {
            ctx.fillStyle = "black"
            ctx.fillText("Press E to open/ close the Armory", ctx.canvas.width / 2, ctx.canvas.height - 30);
        } else if (this.drawExitSZPrompt) {
            ctx.fillStyle = "black"
            ctx.fillText("Press E to exit the Safe Zone", ctx.canvas.width / 2, ctx.canvas.height - 30);
        }
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

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2, mouse: Vec2 | null): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;
        if (keys['p'] && G_CONFIG.UNLOCK_ALL_GUNS && !this.pWasPressed) {
            this.armory.isOpen = !this.armory.isOpen;
            player.uiOpen = this.armory.isOpen; // Set player's uiOpen state based on armory state
        }
        this.pWasPressed = keys['p'];
    }
}
