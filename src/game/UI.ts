import { ImagePath } from "../engine/assetmanager.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";
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
        const player: Player | undefined = game.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) {
            throw new Error(`Could not find player entity!`);
        }

        for (const item of player.items) {
            const sprite: HTMLImageElement = game.getSprite(item.sprite);
            const w = sprite.width;
            const h = sprite.height;
            // TODO: Draw the items along the bottom of the screen
            //       and buffs along the top.
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
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {

    }
}
