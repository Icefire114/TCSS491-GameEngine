import { AnimationData } from "./Animator.js";
import { GameEngine } from "./gameengine.js";
import { Vec2 } from "./types.js";


export class Renderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Allows you to access the raw `CanvasRenderingContext2D` object via a callback.
     *
     * @param callback The callback to call with the raw {@link CanvasRenderingContext2D}.
     */
    public withRawContext(callback: (ctx: CanvasRenderingContext2D) => void): void {
        callback(this.ctx);
    }

    public drawSpriteAtWorldPos(pos: Vec2, spriteData: AnimationData, currentAnimFrameInfo: { spriteSheetOffsetX: number, spriteSheetOffsetY: number }): void {
        const { screenPos, screenSize } = this.computeScreenRect(pos, spriteData);
        this.ctx.drawImage(
            spriteData.sprite,
            currentAnimFrameInfo.spriteSheetOffsetX,        // srcX
            currentAnimFrameInfo.spriteSheetOffsetY,        // srcY
            spriteData.frameWidth,                          // srcWidth
            spriteData.frameHeight,                         // srcHeight
            screenPos.x,                                    // dstX
            screenPos.y,                                    // dstY
            screenSize.x,                                   // dstWidth
            screenSize.y                                    // dstHeight
        );
    }

    public drawRawSpriteAtWorldPos(pos: Vec2, sprite: HTMLImageElement, forceScaleToSize?: Vec2): void {
        const { screenPos, screenSize } = this.computeScreenRect(
            pos,
            {
                sprite: sprite,
                frameWidth: sprite.width,
                frameHeight: sprite.height,
                frameCount: 1,
                offsetX: 0
            },
            forceScaleToSize
        );

        this.ctx.drawImage(
            sprite,
            screenPos.x,        // dstX
            screenPos.y,        // dstY
            screenSize.x,       // dstWidth
            screenSize.y        // dstHeight
        );
    }

    private computeScreenRect(pos: Vec2, anim: AnimationData, forceScaleToSize?: Vec2): { screenPos: Vec2, screenSize: Vec2 } {
        const mInPx = new Vec2(
            this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT,
            this.ctx.canvas.height / GameEngine.WORLD_UNITS_IN_VIEWPORT,
        )

        const worldSize = new Vec2(
            forceScaleToSize ? forceScaleToSize.x : anim.frameWidth / mInPx.x,
            forceScaleToSize ? forceScaleToSize.y : anim.frameHeight / mInPx.y
        );
        const screenSize = Vec2.compDivScalar(Vec2.compMul(worldSize, mInPx), GameEngine.g_INSTANCE.zoom);


        const screenPos = Vec2.compDivScalar(
            Vec2.compMul(
                new Vec2(
                    (pos.x - worldSize.x / 2 - GameEngine.g_INSTANCE.viewportX + anim.offsetX),
                    (pos.y - worldSize.y - GameEngine.g_INSTANCE.viewportY)
                ),
                mInPx
            ),
            GameEngine.g_INSTANCE.zoom
        );

        return {
            screenPos,
            screenSize,
        };
    }
}
