import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { unwrap } from "../../engine/util.js";
import { ShaderRegistry } from "../../engine/WebGL/ShaderRegistry.js";
import { WebGL } from "../../engine/WebGL/WebGL.js";
import { Mountain } from "../worldEntities/mountain.js";

export class ChristmasTree implements Entity {
    tag: string = "ChristmasTree";
    id: EntityID;

    position: Vec2;
    // trees cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath = new ImagePath("res/img/world_deco/tree_2.png");
    removeFromWorld: boolean = false;

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
            frameWidth: 1024,
            frameHeight: 1024,
            frameCount: 1,
            offsetX: 0
        };

        const shader = unwrap(ShaderRegistry.getShader(WebGL.CHRISTMAS_TREE, currentAnim.sprite), "Did not find shader for given template");

        const sunAngle = -130; // or calculate based on game time
        const rad = (sunAngle * Math.PI) / 180;
        const sunDir = [Math.cos(rad), Math.sin(rad)];

        shader.render([
            // Snow shader uniforms
            {
                u_snowHeight: 0.6,
                u_snowThickness: 0.5
            },
            // Sun shader uniforms
            {
                u_sunDirection: sunDir,
                u_intensity: 0.3,
                u_baseLight: 0.6,
                u_warmth: 0.05
            },
            // christmas lights
            {
                u_time: performance.now() / 500
            }
        ])

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
