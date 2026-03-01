import { ForceDraw, Vec2 } from "../../engine/types.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";


export abstract class Background implements Entity, ForceDraw{

    parallaxSpeed: number;
    spritePaths: ImagePath[];
    static currentSpriteIndex = 0;
    

    public id: EntityID;
    public player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
    tag: string;

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider: null = null;
    sprite = null;
    removeFromWorld: boolean = false;
    worldWidth = GameEngine.WORLD_UNITS_IN_VIEWPORT;
    // startY: number;

    constructor(tag: string, spritePaths: ImagePath[], parallaxSpeed: number) {
        this.tag = tag;
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        
        this.parallaxSpeed = parallaxSpeed;
        this.spritePaths = spritePaths;
        // this.startY = 30;
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.position = this.player.position;
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const intro = game.getUniqueEntityByTag("intro_screen") as any;
        const blendAlpha = intro ? intro.getAlpha() : 0;

        const sprite  = game.getSprite(this.spritePaths[Background.currentSpriteIndex]);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const w = this.worldWidth * scale;
        const h = sprite.height * (w / sprite.width);

        // Total parallax drift in screen space
        const drift = (game.viewportX * this.parallaxSpeed * scale) / game.zoom;

        // Wrap drift so it stays within one tile width
        const wrappedDrift = ((drift % w) + w) % w;

        // Tile 1 starts at left edge minus the wrapped drift
        const screenX  = -wrappedDrift;
        // Tile 2 is always exactly one tile width to the right
        const screenX2 = screenX + w - 1;

        const screenY = ctx.canvas.height;

        ctx.drawImage(sprite,  screenX, screenY - h, w, h);
        ctx.drawImage(sprite, screenX2, screenY - h, w, h);

        this.blueSmokeDrawing(ctx, blendAlpha);
    }

    /**
     * Drawing the blue smoke in the intro
     */
    blueSmokeDrawing(ctx: CanvasRenderingContext2D, blendAlpha: number) {
        if (blendAlpha > 0) {
            const W = ctx.canvas.width;
            const H = ctx.canvas.height;
            const blueGrad = ctx.createLinearGradient(0, 0, 0, H);
            blueGrad.addColorStop(0, `rgba(10, 18, 40,  ${blendAlpha})`);
            blueGrad.addColorStop(0.5, `rgba(20, 40, 75,  ${blendAlpha * 0.8})`);
            blueGrad.addColorStop(1, `rgba(40, 70, 110, ${blendAlpha * 0.5})`);
            ctx.fillStyle = blueGrad;
            ctx.fillRect(0, 0, W, H);
        }
    }

    static randomizeIndex(spriteCount: number) {
        Background.currentSpriteIndex = Math.floor(Math.random() * spriteCount);
    }
}