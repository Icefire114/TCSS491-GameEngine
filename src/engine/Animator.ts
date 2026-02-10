import { ImagePath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";
import { Renderer } from "./Renderer.js";
import { Vec2 } from "./types.js";
import { unwrap } from "./util.js";

export enum AnimationState {
    IDLE,
    WALK_L,
    WALK_R,
    JUMP_R,
    JUMP_L,
    FALL,
    ATTACK,
    HIT,
    DEATH,
    RUN,
}

export type SpriteSheetInfo = {
    sprite: ImagePath;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;

    // Offset to help the sprite sheet be centered due to transparency on the spritesheet
    offestX?: number;
};

export type AnimationData = {
    sprite: HTMLImageElement,
    frameWidth: number,
    frameHeight: number,
    frameCount: number,
    offsetX: number,
};

export class Animator {
    private readonly ANIMATION_FPS = 6;

    private currentState: AnimationState = AnimationState.IDLE;
    private elapsed = 0; // seconds
    private secondsPerFrame = 1 / this.ANIMATION_FPS;
    private forceScaleToSize: Vec2 | undefined;

    private spriteSheet: Record<AnimationState, AnimationData | null> = {
        [AnimationState.IDLE]: null,
        [AnimationState.WALK_L]: null,
        [AnimationState.WALK_R]: null,
        [AnimationState.JUMP_R]: null,
        [AnimationState.JUMP_L]: null,
        [AnimationState.FALL]: null,
        [AnimationState.ATTACK]: null,
        [AnimationState.HIT]: null,
        [AnimationState.DEATH]: null,
        [AnimationState.RUN]: null,
    };

    /**
     * @param spriteSheets The spite sheets and the animation state that they correspond to.
     * @param forceScaleToSize If provided, then the resulting animation will be scaled to that size 
     * (useful for items where sprites are not the same size).
     */
    constructor(spriteSheets: [SpriteSheetInfo, AnimationState][], forceScaleToSize?: Vec2) {
        this.forceScaleToSize = forceScaleToSize;
        for (const spriteSheet of spriteSheets) {
            this.spriteSheet[spriteSheet[1]] = {
                sprite: unwrap(GameEngine.g_INSTANCE.getSprite(spriteSheet[0].sprite)),
                frameHeight: spriteSheet[0].frameHeight,
                frameCount: spriteSheet[0].frameCount,
                frameWidth: spriteSheet[0].frameWidth,
                offsetX: spriteSheet[0].offestX ?? 0,
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

    private computeFrameIdx(currentAnim: AnimationData): number {
        let frameIdx =
            Math.floor(this.elapsed / this.secondsPerFrame) % currentAnim.frameCount;
        // If we are in death animation, then we do not want to replay the animation.
        if (this.currentState === AnimationState.DEATH && Math.floor(this.elapsed / this.secondsPerFrame) >= currentAnim.frameCount) {
            frameIdx = currentAnim.frameCount - 1;
        }

        return frameIdx;
    }

    drawCurrentAnimFrameAtPos(pos: Vec2): void {
        const currentAnim = this.spriteSheet[this.currentState];
        if (!currentAnim) {
            throw new Error(
                `SpriteSheet for animation state ${this.currentState} is null`
            );
        }
        let frameIdx = this.computeFrameIdx(currentAnim);
        GameEngine.g_INSTANCE.renderer.drawSpriteAtWorldPos(
            pos,
            currentAnim,
            {
                spriteSheetOffsetX: frameIdx * currentAnim.frameWidth,
                spriteSheetOffsetY: 0
            },
            this.forceScaleToSize
        );
    }
}
