import { ImagePath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";
import { Vec2 } from "./types.js";
import { unwrap } from "./util.js";

export enum AnimationState {
    IDLE,
    WALK_L,
    WALK_R,
    JUMP,
    FALL,
    ATTACK,
    HIT,
    DEATH,
}

export type SpriteSheetInfo = {
    sprite: ImagePath;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
};

export class Animator {
    private readonly ANIMATION_FPS = 6;

    private currentState: AnimationState = AnimationState.IDLE;
    private elapsed = 0; // seconds
    private secondsPerFrame = 1 / this.ANIMATION_FPS;

    private spriteSheet: Record<AnimationState,
        {
            sprite: HTMLImageElement,
            frameWidth: number,
            frameHeight: number,
            frameCount: number
        } | null
    > = {
            [AnimationState.IDLE]: null,
            [AnimationState.WALK_L]: null,
            [AnimationState.WALK_R]: null,
            [AnimationState.JUMP]: null,
            [AnimationState.FALL]: null,
            [AnimationState.ATTACK]: null,
            [AnimationState.HIT]: null,
            [AnimationState.DEATH]: null
        };

    constructor(spriteSheets: [SpriteSheetInfo, AnimationState][]) {
        for (const spriteSheet of spriteSheets) {
            this.spriteSheet[spriteSheet[1]] = {
                sprite: unwrap(GameEngine.g_INSTANCE.getSprite(spriteSheet[0].sprite)),
                frameHeight: spriteSheet[0].frameHeight,
                frameCount: spriteSheet[0].frameCount,
                frameWidth: spriteSheet[0].frameWidth,
            }
        }
    }

    updateAnimState(newState: AnimationState, deltaTime: number): void {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.elapsed = 0;
        } else {
            this.elapsed += deltaTime;
        }
    }

    drawCurrentAnimFrameAtPos(ctx: CanvasRenderingContext2D, pos: Vec2): void {
        const currentAnim = this.spriteSheet[this.currentState];

        if (!currentAnim) {
            throw new Error(
                `SpriteSheet for animation state ${this.currentState} is null`
            );
        }

        const frameIdx = Math.floor(this.elapsed / this.secondsPerFrame) % currentAnim.frameCount;
        const game = GameEngine.g_INSTANCE;

        const player_width_in_world_units = 10;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = currentAnim.sprite.height * (w / currentAnim.sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (pos.x - game.viewportX) * scale / game.zoom;
        const screenY = (pos.y - game.viewportY) * scale / game.zoom;

        ctx.drawImage(
            currentAnim.sprite,
            frameIdx * currentAnim.frameWidth, // srcImgX
            0, // srcImgY
            currentAnim.frameWidth, // srcImgW
            currentAnim.frameHeight, // srcImgH
            screenX - w / 2,
            screenY - h,
            currentAnim.frameWidth,
            currentAnim.frameHeight
        );
    }
}
