import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";
import { unwrap } from "../engine/util.js";
import { Buff, BuffType, TempBuff } from "./Items/Buff.js";
import { ItemType } from "./Items/Item.js";
import { Player } from "./worldEntities/player.js";
import { ShopUI } from "./ShopUI.js";

export class UILayer implements Entity {
    readonly id: EntityID;
    readonly tag: string = "UI_LAYER";

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;
    drawEnterSZPrompt: boolean = false;
    drawOpenShopPrompt: boolean = false;

    // Shop UI Properties
    private shop: ShopUI;
    private lWasPressed: boolean = false;


    constructor(shop: ShopUI) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.shop = shop;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
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

        //draw player health on top right corner of the screen
        if (player.health < 100) {
            ctx.fillStyle = "green";
        } else if (player.health < 200) {
            ctx.fillStyle = "orange";
        } else {
            ctx.fillStyle = "red";
        }
        ctx.font = "30px Arial";
        ctx.fillText(`Health: ${player.health}%`, ctx.canvas.width - 200, 40);
        //console.log(`Player Health: ${player.health}`);

        //draw player shield below health
        ctx.fillStyle = "blue";
        ctx.font = "30px Arial";
        ctx.fillText(`Shield: ${player.shield}%`, ctx.canvas.width - 200, 80);
        //console.log(`Player Shield: ${player.shield}`);

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
        }
        ctx.restore();
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        // DEBUG: To see the visualization of the Shop UI (WILL DELETE LATERRRRR)
        if (keys['l'] && !this.lWasPressed) {
            this.shop.isOpen = !this.shop.isOpen;
        }
        this.lWasPressed = keys['l'];
    }
}
