import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { randomOf, unwrap } from "../../engine/util.js";
import { ShaderRegistry } from "../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../engine/WebGL/WebGL.js";
import { Mountain } from "../worldEntities/mountain.js";

export class Bush implements Entity {
    tag: string = "bush";
    id: EntityID;

    position: Vec2;
    // bushes cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath;
    removeFromWorld: boolean = false;

    static readonly SPRITE_PATHS = [
        new ImagePath("res/img/world_deco/bush_1.png"),
        new ImagePath("res/img/world_deco/berry_bush_1.png"),
        new ImagePath("res/img/world_deco/berry_bush_2.png")
    ] as const;

    /**
     * 
     * @param position 
     * @param variant An optional override to force a certain sprite to be rendered.
     *  Must be a valid index of {@link Bush.SPRITE_PATHS}.
     */
    constructor(position: Vec2, variant?: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
        this.sprite = randomOf(Bush.SPRITE_PATHS);
        if (variant) {
            if (variant >= Bush.SPRITE_PATHS.length) {
                throw new Error("Invalid variant index");
            }
            this.sprite = Bush.SPRITE_PATHS[variant];
        }

    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 1,
            offsetX: 0
        };
        const shader = unwrap(ShaderRegistry.getShader(WebGL.SNOW_AND_SUN, currentAnim.sprite), "Did not find shader for given template");

        const sunAngle = -130; // or calculate based on game time
        const rad = (sunAngle * Math.PI) / 180;
        const sunDir = [Math.cos(rad), Math.sin(rad)];
        shader.render([
            // Snow shader uniforms
            {
                u_snowHeight: 0.5,
                u_snowThickness: 0.85
            },
            // Sun shader uniforms
            {
                u_sunDirection: sunDir,
                u_intensity: 0.3,
                u_baseLight: 0.6,
                u_warmth: 0.15
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
    }
}