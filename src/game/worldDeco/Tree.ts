import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/Vec2.js";
import { clamp, unwrap } from "../../engine/util.js";
import { ShaderRegistry } from "../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../engine/WebGL/WebGL.js";
import { Mountain } from "../worldEntities/mountain.js";
import { DayNightCycle } from "../worldBackground/DayNightCycle.js";

export class Tree implements Entity {
    tag: string = "Tree";
    id: EntityID;

    position: Vec2;
    // trees cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath = new ImagePath("res/img/world_deco/tree_1.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                frameCount: 1,
                frameHeight: 512,
                frameWidth: 512,
                sprite: new ImagePath("res/img/world_deco/tree_1.png")
            },
            AnimationState.IDLE
        ]
    ],
        // new Vec2(4, 10)
    );

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
            frameWidth: 512,
            frameHeight: 512,
            frameCount: 1,
            offsetX: 0
        };
        const shader = unwrap(ShaderRegistry.getShader(WebGL.SNOW_AND_SUN, currentAnim.sprite), "Did not find shader for given template");
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
            // Snow shader uniforms
            {
                u_snowHeight: 0.45,
                u_snowThickness: 0.7
            },
            // Sun shader uniforms
            {
                u_sunDirection: sunDir,
                u_intensity: 0.05 * ambient,
                u_baseLight: brightness,
                u_warmth: 0.15 * ambient
            },
        ]);

        game.renderer.drawRawCanvasAtWorldPos(
            this.position,
            shader.canvas
        );
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}
