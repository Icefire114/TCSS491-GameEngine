import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/Vec2.js";
import { clamp, randomOf, unwrap } from "../../engine/util.js";
import { Mountain } from "../worldEntities/mountain.js";
import { ShaderRegistry } from "../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../engine/WebGL/WebGL.js";
import { DayNightCycle } from "../worldBackground/DayNightCycle.js";

export class FireBarrel implements Entity {
    tag: string = "FireBarrel";
    id: EntityID;

    position: Vec2;
    // barrels cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath;
    removeFromWorld: boolean = false;
    animator: Animator;
    scale: Vec2;

    static readonly SPRITE_PATHS = [
        new ImagePath("res/img/world_deco/fire_barrel.png"),
    ] as const;

    /**
     * 
     * @param position 
     * @param variant An optional override to force a certain sprite to be rendered.
     *  Must be a valid index of {@link FireBarrel.SPRITE_PATHS}.
     */
    constructor(position: Vec2, scale: number = 1, variant?: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
        this.sprite = randomOf(FireBarrel.SPRITE_PATHS);
        if (variant) {
            if (variant >= FireBarrel.SPRITE_PATHS.length) {
                throw new Error("Invalid variant index");
            }
            this.sprite = FireBarrel.SPRITE_PATHS[variant];
        }
        this.scale = new Vec2(36 * scale, 80 * scale);
        this.animator = new Animator(
            [
                [
                    {
                        frameCount: 4,
                        frameWidth: 36,
                        frameHeight: 80,
                        sprite: this.sprite
                    },
                    AnimationState.IDLE
                ]
            ],
            this.scale
        );
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = this.animator.getCurrentFrame();
        const shader = unwrap(ShaderRegistry.getShader(WebGL.AREA_LIGHT, currentAnim.spriteData.sprite), "Did not find shader for given template");
        const dnc: DayNightCycle = unwrap(game.getUniqueEntityByTag("DayNightCycle")) as DayNightCycle;
        /**
         * Maps cycle time to a number like so:
         * \left(\frac{1+\cos\left(2\pi\left(x-0.25\right)\right)}{2}\right)^{1.3} (its TeX so use something nice to render it)
         * https://www.desmos.com/calculator/svjimn17wv
         */
        const ambient = Math.pow((1 + Math.cos(2 * Math.PI * (dnc.cycleTime - 0.25))) / 2, 1.3)
        const MIN_BRIGHTNESS = 0.2;
        const brightness = ambient + MIN_BRIGHTNESS * (1 - clamp(2 * ambient, 0, 1));

        const sunAngleDeg = dnc.cycleTime * 360;
        const rad = (sunAngleDeg * Math.PI) / 180;
        const sunDir = [Math.cos(rad), Math.sin(rad)];
        shader.render([
            // Area light shader uniforms
            {
                u_lightCount: 1n,
                u_lightSize: [[30]],
                u_lightPos: [[18 + currentAnim.spriteSheetData.spriteSheetOffsetX, 24]],
                u_lightColor: [[1.0, 1.0, 1.0, 1.0]], // rgba
                u_ambient: brightness
            }
        ]);

        const { screenPos, screenSize } = game.renderer.computeScreenRect(this.position, currentAnim.spriteData, currentAnim.forceScaleToSize);
        
        ctx.drawImage(
            shader.canvas,
            currentAnim.spriteSheetData.spriteSheetOffsetX,        // srcX
            currentAnim.spriteSheetData.spriteSheetOffsetY,        // srcY
            currentAnim.spriteData.frameWidth,                          // srcWidth
            currentAnim.spriteData.frameHeight,                         // srcHeight
            screenPos.x,                                    // dstX
            screenPos.y,                                    // dstY
            screenSize.x,                                   // dstWidth
            screenSize.y                                    // dstHeight
        );
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}