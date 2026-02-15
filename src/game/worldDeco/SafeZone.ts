import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2, DrawLayer } from "../../engine/types.js";
import { Mountain } from "../worldEntities/mountain.js"; 
import { ShopUI } from "../ShopUI.js";
import { Tree } from "../worldDeco/Tree.js"; 

export class SafeZone implements Entity {
    readonly tag: string = "SafeZone";
    readonly id: EntityID;
    position: Vec2;
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null = null;
    sprite: null = null;
    removeFromWorld: boolean = false;

    private startX: number;
    private endX: number;
    private midX: number;
    private hasSpawnedTree: boolean = false;
    private isPlayerInside: boolean = false;
    private wasPlayerInside: boolean = false;

    constructor(startX: number, endX: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.startX = startX;
        this.endX = endX;
        this.midX = (startX + endX) / 2;
        this.position = new Vec2(startX, 0);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain;
        if (!mountain) return;

        this.position.y = mountain.getHeightAt(this.position.x);

        if (!this.hasSpawnedTree) {
            const treeY = mountain.getHeightAt(this.midX);
            const treeEntity = new Tree(new Vec2(this.midX, treeY));
            GameEngine.g_INSTANCE.addEntity(treeEntity, DrawLayer.WORLD_DECORATION);
            this.hasSpawnedTree = true;
        }

        // Handles the logic with player is in safezone/shop
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player");
        if (player) {
            this.isPlayerInside = player.position.x >= this.startX && player.position.x <= this.endX;

            const shop = GameEngine.g_INSTANCE.getUniqueEntityByTag("shop_ui") as ShopUI;

            // Our keybind to open the shop
            if (this.isPlayerInside && (keys["e"] || keys["E"])) {
                if (shop) shop.isOpen = !shop.isOpen;
                keys["e"] = false;
                keys["E"] = false;
            }

            // Various miscellaneous tracking properties of player 
            if (this.wasPlayerInside && !this.isPlayerInside) {
                if (shop) shop.isOpen = false;
            }

            this.wasPlayerInside = this.isPlayerInside;

            if (player.position.x > this.endX + 1000) {
                this.removeFromWorld = true;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // TEMP: Only used for visualization
        this.drawTempSafeZoneLooks(ctx, game);

        const shop = game.getUniqueEntityByTag("shop_ui") as ShopUI;

    
        // Drawing the "Click E to open shop" message
        if (this.isPlayerInside && shop && !shop.isOpen) {
                this.drawInteractionPrompt(ctx, game);
        }
    }

    /**
     * Helper method to draw the message above player for opening shop
     */
    private drawInteractionPrompt(ctx: CanvasRenderingContext2D, game: GameEngine) {
        const player = game.getUniqueEntityByTag("player");
        if (!player) return;

        // Positioning of the message
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (player.position.x - game.viewportX) * scale;
        const screenY = (player.position.y - game.viewportY) * scale - 75;

        ctx.save();
        
        // Drawing the message itself
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        const boxWidth = 200;
        const boxHeight = 30;
        ctx.fillRect(screenX - boxWidth / 2, screenY - boxHeight, boxWidth, boxHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PRESS [E] TO OPEN SHOP", screenX, screenY - boxHeight / 2);
        
        ctx.restore();
    }

    /**
     * Method to draw all the TEMP DRAWINGS
     * 
     */
    private drawTempSafeZoneLooks(ctx: CanvasRenderingContext2D, game: GameEngine) {
        const mountain = game.getUniqueEntityByTag("mountain") as Mountain;
        if (!mountain) return;

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Gray Wall
        this.drawWall(ctx, game, scale, this.startX + 15, mountain.getHeightAt(this.startX) + 5);
        this.drawWall(ctx, game, scale, this.endX - 15, mountain.getHeightAt(this.endX));

        // Drawing the Shop
        const numStoresPerSide = 2;

        // Drawing shops to the left of the tree
        for (let i = 1; i <= numStoresPerSide; i++) {
            const x = this.startX + (this.midX - this.startX) * (i / (numStoresPerSide + 1)) + 5;
            this.drawStore(ctx, game, scale, x, mountain.getHeightAt(x));
        }

        // Drawing shops to the right of the tree
        for (let i = 1; i <= numStoresPerSide; i++) {
            const x = this.midX + (this.endX - this.midX) * (i / (numStoresPerSide + 1)) - 10;
            this.drawStore(ctx, game, scale, x, mountain.getHeightAt(x));
        }
        
    }

    /** 
     * Method to draw the walls
     */
    private drawWall(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number, x: number, y: number) {
        const screenX = (x - game.viewportX) * scale;
        const screenY = (y - game.viewportY) * scale;
        const w = 15 * scale;
        const h = 35 * scale; 

        ctx.fillStyle = "#666666"; 
        ctx.fillRect(screenX - w / 2, screenY - h, w, h);
        ctx.fillStyle = "#444444";
        ctx.fillRect(screenX - (w * 1.2) / 2, screenY - h, w * 1.2, 8 * scale);
    }

    /** 
     * Helper to draw shop
     */
    private drawStore(ctx: CanvasRenderingContext2D, game: GameEngine, scale: number, x: number, y: number) {
        const screenX = (x - game.viewportX) * scale;
        const screenY = (y - game.viewportY) * scale;
        const w = 12 * scale;
        const h = 8 * scale;

        // Drawing House
        ctx.fillStyle = "#5D2E0A"; 
        ctx.beginPath();
        ctx.moveTo(screenX - w/2 - 2, screenY - h);
        ctx.lineTo(screenX, screenY - h - 10 * scale);
        ctx.lineTo(screenX + w/2 + 2, screenY - h);
        ctx.fill();
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    }
}