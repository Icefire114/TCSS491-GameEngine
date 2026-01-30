import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";
import { unwrap } from "../engine/util.js";
import { Item, ItemType, TempBuff } from "./Items/Item.js";
import { Player } from "./player.js";

export class UILayer implements Entity {
    readonly id: EntityID;
    readonly tag: string = "UI_LAYER";

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: Collider | null = null;
    sprite: ImagePath | null = null;
    removeFromWorld: boolean = false;


    constructor() {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const player: Player = unwrap(game.getUniqueEntityByTag("player"), "Failed to get the player!") as Player;


        // Collect TEMP_BUFFS
        const tempBuffs: (Item & TempBuff)[] = player.items.filter(
            (item) => item.type === ItemType.TEMP_BUFF
        ) as (Item & TempBuff)[];

        // Draw TEMP_BUFFS in the top-right, 2% in from the left edge
        const margin = Math.round(ctx.canvas.width * 0.02);
        const iconSize = 32; // adjust to your sprite size
        const spacing = 4;
        const buffBarLen = 4;

        tempBuffs.forEach((buff, idx) => {
            const sprite: HTMLImageElement = game.getSprite(buff.sprite);
            const x = margin + idx * (iconSize + spacing);
            const y = margin;

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
                case ItemType.PERM_BUFF:
                    break;

                // Already drawn
                case ItemType.TEMP_BUFF:
                // These are instantly applied buffs, and should not be displayed
                case ItemType.INSTANT_APPLY:
                    break;
            }
            ctx.restore();
        }
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}
