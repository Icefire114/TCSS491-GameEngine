import { AnimationData } from "./Animator.js";
import { GameEngine } from "./gameengine.js";
import { Vec2 } from "./Vec2.js";

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

    public drawSpriteAtWorldPos(
        pos: Vec2,
        spriteData: AnimationData,
        currentAnimFrameInfo: { spriteSheetOffsetX: number, spriteSheetOffsetY: number },
        forceScaleToSize?: Vec2): void {
        const { screenPos, screenSize } = this.computeScreenRect(pos, spriteData, forceScaleToSize);
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


    public drawRawCanvasAtWorldPos(pos: Vec2, sprite: HTMLCanvasElement, forceScaleToSize?: Vec2): void {
        const { screenPos, screenSize } = this.computeScreenRect(
            pos,
            {
                // conputeScreenRect doesn't really NEED this, so we can just trick it :)
                // this will undoubtably cause issues if I ever touch conputeScreenRect,
                // and it will result at me calling myself names, but fuck it that's future me's problem
                sprite: {} as HTMLImageElement,
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

    public convertWorldPosToScreenPos(pos: Vec2, objectSizePX: Vec2): Vec2 {
        const mInPx = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenPos = Vec2.compDivScalar(
            Vec2.compMulScalar(
                new Vec2(
                    (pos.x - objectSizePX.x / 2 - GameEngine.g_INSTANCE.viewportX),
                    (pos.y - objectSizePX.y - GameEngine.g_INSTANCE.viewportY)
                ),
                mInPx
            ),
            GameEngine.g_INSTANCE.zoom
        );

        return screenPos;
    }

    /**
     * Draws a rectangle in world space coordinates.
     * 
     * @param worldPos The world position (center-bottom of the rectangle)
     * @param worldSize The size of the rectangle in world units
     * @param fillColor Optional fill color (e.g., 'rgba(255, 0, 0, 0.5)')
     * @param strokeColor Optional stroke color (e.g., 'red')
     * @param lineWidth Optional stroke line width in screen pixels (default: 1)
     */
    public drawRectAtWorldPos(
        worldPos: Vec2,
        worldSize: Vec2,
        fillColor?: string,
        strokeColor?: string,
        lineWidth: number = 1
    ): void {
        const mInPx = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Convert world size to screen size
        const screenSize = Vec2.compDivScalar(
            Vec2.compMulScalar(worldSize, mInPx),
            GameEngine.g_INSTANCE.zoom
        );

        // Convert world position to screen position
        // Position represents bottom-left, so we offset by full height and 
        const screenPos = Vec2.compDivScalar(
            Vec2.compMulScalar(
                new Vec2(
                    worldPos.x - GameEngine.g_INSTANCE.viewportX,
                    worldPos.y - worldSize.y - GameEngine.g_INSTANCE.viewportY
                ),
                mInPx
            ),
            GameEngine.g_INSTANCE.zoom
        );

        // Draw the rectangle
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(screenPos.x, screenPos.y, screenSize.x, screenSize.y);
        }

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(screenPos.x, screenPos.y, screenSize.x, screenSize.y);
        }
    }

    private computeScreenRect(pos: Vec2, anim: AnimationData, forceScaleToSize?: Vec2): { screenPos: Vec2, screenSize: Vec2 } {
        const mInPx = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const worldSize = new Vec2(
            forceScaleToSize ? forceScaleToSize.x : anim.frameWidth / mInPx,
            forceScaleToSize ? forceScaleToSize.y : anim.frameHeight / mInPx
        );

        const screenSize = Vec2.compDivScalar(Vec2.compMulScalar(worldSize, mInPx), GameEngine.g_INSTANCE.zoom);

        const screenPos = Vec2.compDivScalar(
            Vec2.compMulScalar(
                new Vec2(
                    (pos.x - worldSize.x / 2 - GameEngine.g_INSTANCE.viewportX + anim.offsetX),
                    (pos.y - worldSize.y - GameEngine.g_INSTANCE.viewportY)
                ),
                mInPx
            ),
            GameEngine.g_INSTANCE.zoom
        );

        return { screenPos, screenSize };
    }

    /**
     * Convert a size given in **screen pixels** into the equivalent size in
     * **world units** (metres) for the current viewport / zoom level.
     *
     * @param pxSize  Width or height in screen pixels.
     * @returns       The same length expressed in world units.
     */
    public pixelsToWorldUnits(pxSize: number): number {
        const mInPx = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        return pxSize / (mInPx / GameEngine.g_INSTANCE.zoom);
    }

    /**
     * Convert a size given in **screen pixels** into the equivalent size in
     * **world units** (metres) for the current viewport / zoom level.
     *
     * @param pxSize  Width or height in screen pixels.
     * @returns       The same length expressed in world units.
     */
    public pixelsToWorldUnitsVec2(pxSize: Vec2): Vec2 {
        const mInPx = this.ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        return Vec2.compDivScalar(pxSize, mInPx / GameEngine.g_INSTANCE.zoom);
    }
}
