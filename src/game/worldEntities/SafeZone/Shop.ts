import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable, Collider } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/types.js";
import { unwrap } from "../../../engine/util.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { ShopUI } from "./ShopUI.js";
import { UILayer } from "../../UI.js";
import { Player } from "../player.js";

export class Shop implements Entity, Collidable {
    tag: string = "Shop";
    id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2();
    physicsCollider: BoxCollider;
    sprite: ImagePath = new ImagePath("res/img/safe_zone/shop.png");
    removeFromWorld: boolean = false;

    size: Vec2 = new Vec2(24, 14);

    private isShopOpen: boolean = false;

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
        this.physicsCollider = new BoxCollider(this.size.x, this.size.y);
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        GameEngine.g_INSTANCE.renderer.drawRawSpriteAtWorldPos(
            this.position,
            GameEngine.g_INSTANCE.getSprite(this.sprite),
            this.size
        );

        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            GameEngine.g_INSTANCE.renderer.drawRectAtWorldPos(
                Vec2.compSub(this.position, new Vec2(this.size.x / 2, 0)),
                this.size,
                "rgba(183, 0, 255,0)",
                "rgb(183, 0, 255)",
                2
            );
        }
    }

    private isPlayerTouching(): boolean {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        return this.physicsCollider.collides(this, player);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        const UI: UILayer = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("UI_LAYER")) as UILayer;
        UI.drawOpenShopPrompt = this.isPlayerTouching();
        if (UI.drawOpenShopPrompt && keys['e']) {
            const shop_ui: ShopUI = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("shop_ui")) as ShopUI;
            shop_ui.isOpen = !shop_ui.isOpen;
            keys['e'] = false;
        }


        // Route clicks to shop UI when open
        if (keys["Mouse0"] && clickCoords) {
            const shop_ui = GameEngine.g_INSTANCE.getUniqueEntityByTag("shop_ui") as ShopUI | undefined;
            if (shop_ui?.isOpen) {
                const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const canvasX = (clickCoords.x - rect.left) * (canvas.width / rect.width);
                    const canvasY = (clickCoords.y - rect.top) * (canvas.height / rect.height);
                    shop_ui.handleClick(canvasX, canvasY);
                    keys["Mouse0"] = false; // consume the click so player doesn't shoot
                }
            }
        }
    }
}