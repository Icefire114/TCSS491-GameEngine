import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { randomOf, unwrap } from "../../engine/util.js";
import { ShaderRegistry } from "../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../engine/WebGL/WebGL.js";
import { Mountain } from "../worldEntities/mountain.js";

export class Rock implements Entity {
    tag: string = "rock";
    id: EntityID;

    position: Vec2;
    // rocks cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath;
    removeFromWorld: boolean = false;

    static readonly SPRITE_PATHS = [
        new ImagePath("res/img/world_deco/rock_1.png"),
    ] as const;
    private scale: number;

    /**
     * 
     * @param position 
     * @param variant An optional override to force a certain sprite to be rendered.
     *  Must be a valid index of {@link Rock.SPRITE_PATHS}.
     */
    constructor(position: Vec2, scale: number = 1, variant?: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = position;
        this.sprite = randomOf(Rock.SPRITE_PATHS);
        if (variant) {
            if (variant >= Rock.SPRITE_PATHS.length) {
                throw new Error("Invalid variant index");
            }
            this.sprite = Rock.SPRITE_PATHS[variant];
        }
        this.scale = scale;
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
            shader.canvas,
            new Vec2(12 * this.scale, 12 * this.scale)
        );
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
    }
}