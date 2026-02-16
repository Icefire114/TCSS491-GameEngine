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
    RELOAD,
}

export enum AnimationEvent {
    ATTACK_FIRE = "attack_fire",
    ATTACK_END = "attack_end",
    RELOAD_END = "reload_end",
}

export type SpriteSheetInfo = {
    sprite: ImagePath;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;

    // Offset to help the sprite sheet be centered due to transparency on the spritesheet
    offestX?: number;

    // what frame to fire the weapon on (only used for attack animations)
    fireOnFrame?: number;

    // speed multiplier
    animationSpeed?: number;
};

export type AnimationData = {
    sprite: HTMLImageElement,
    frameWidth: number,
    frameHeight: number,
    frameCount: number,
    offsetX: number,
};

export class Animator {
    public readonly ANIMATION_FPS = 6;

    private currentState: AnimationState = AnimationState.IDLE;
    private elapsed = 0; // seconds
    private secondsPerFrame = 1 / this.ANIMATION_FPS;
    private forceScaleToSize: Vec2 | undefined;

    private eventCallBacks: Map<AnimationEvent, () => void> = new Map();
    private lastFrameIndex: number = -1;

    private spriteSheet: Record<AnimationState,
        {
            sprite: HTMLImageElement,
            frameWidth: number,
            frameHeight: number,
            frameCount: number,
            offsetX: number,
            fireOnFrame?: number,
            animationSpeed: number
        } | null
    > = {
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
            [AnimationState.RELOAD]: null,
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
                fireOnFrame: spriteSheet[0].fireOnFrame,
                animationSpeed: spriteSheet[0].animationSpeed ?? 1.0
            }
        }
    }

    onEvent(event: AnimationEvent, callback: () => void): void {
        this.eventCallBacks.set(event, callback);
    }

    updateAnimState(newState: AnimationState, deltaTime: number): void {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.elapsed = 0;
            this.lastFrameIndex = -1;
        } else {

            const currentAnim = this.spriteSheet[this.currentState];
            if (currentAnim)
                this.elapsed += deltaTime * currentAnim.animationSpeed;

            this.checkAnimationEvents();
        }
    }

    checkAnimationEvents(): void {
        const currentAnim = this.spriteSheet[this.currentState];
        if (!currentAnim) return;

        const currentFrameIndex = Math.floor(this.elapsed / this.secondsPerFrame);
        const displayedFrame = currentFrameIndex % currentAnim.frameCount;

        // Only fire events once per frame INDEX (not displayed frame)
        if (currentFrameIndex === this.lastFrameIndex) return;

        // Store the PREVIOUS lastFrameIndex before updating it
        const previousFrameIndex = this.lastFrameIndex;
        const previousDisplayedFrame = previousFrameIndex >= 0 ? previousFrameIndex % currentAnim.frameCount : -1;

        // Now update lastFrameIndex for next time
        this.lastFrameIndex = currentFrameIndex;

        // Fire weapon on specific frame during ATTACK animation
        if (this.currentState === AnimationState.ATTACK) {
            if (currentAnim.fireOnFrame !== undefined && displayedFrame === currentAnim.fireOnFrame) {
                this.eventCallBacks.get(AnimationEvent.ATTACK_FIRE)?.();
            }

            // Check if attack animation completed
            if (previousDisplayedFrame === currentAnim.frameCount - 1 && displayedFrame === 0) {
                this.eventCallBacks.get(AnimationEvent.ATTACK_END)?.();
            }
        }

        // reload animation completion
        if (this.currentState === AnimationState.RELOAD) {
            // Fire reload complete event when animation wraps from last frame to frame 0
            if (previousDisplayedFrame === currentAnim.frameCount - 1 && displayedFrame === 0) {
                this.eventCallBacks.get(AnimationEvent.RELOAD_END)?.();
            }
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

    drawCurrentAnimFrameAtOrigin(ctx: CanvasRenderingContext2D, pivotX: number = 0.5, pivotY: number = 0.5): void {
        const currentAnim = this.spriteSheet[this.currentState];
        if (!currentAnim) {
            throw new Error(
                `SpriteSheet for animation state ${this.currentState} is null`
            );
        }

        let frameIdx =
            Math.floor(this.elapsed / this.secondsPerFrame) % currentAnim.frameCount;

        if (this.currentState === AnimationState.DEATH &&
            Math.floor(this.elapsed / this.secondsPerFrame) >= currentAnim.frameCount) {
            frameIdx = currentAnim.frameCount - 1;
        }

        const game = GameEngine.g_INSTANCE;
        const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const worldW = this.forceScaleToSize
            ? this.forceScaleToSize.x
            : currentAnim.frameWidth / meterInPixels;

        const worldH = this.forceScaleToSize
            ? this.forceScaleToSize.y
            : currentAnim.frameHeight / meterInPixels;

        const screenW = (worldW * meterInPixels) / game.zoom;
        const screenH = (worldH * meterInPixels) / game.zoom;

        // Calculate offset based on pivot point (0-1 range)
        // pivotX: 0 = left edge, 0.5 = center, 1 = right edge
        // pivotY: 0 = top edge, 0.5 = center, 1 = bottom edge
        const offsetX = -screenW * pivotX;
        const offsetY = -screenH * pivotY;

        ctx.drawImage(
            currentAnim.sprite,
            frameIdx * currentAnim.frameWidth,
            0,
            currentAnim.frameWidth,
            currentAnim.frameHeight,
            offsetX,  // Pivot point at origin
            offsetY,  // Pivot point at origin
            screenW,
            screenH
        );
    }
}
