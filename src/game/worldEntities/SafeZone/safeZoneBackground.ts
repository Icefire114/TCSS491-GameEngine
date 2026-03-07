import { Background } from "../../worldBackground/Background.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { WebGL } from "../../../engine/WebGL/WebGL.js";
import { ShaderRegistry } from "../../../engine/WebGL/ShaderRegistry.js";
import { unwrap } from "../../../engine/util.js";

export class safeZoneBackground extends Background {

    public size: Vec2 = new Vec2();

    constructor (pos: Vec2, width: number) {
        super("safeZoneBackground", [new ImagePath("res/img/safe_zone/safezoneBg.png")], 0);
        this.position = pos;
        this.size = new Vec2(width, 50);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number): void {
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.spritePaths[0])),
            frameWidth: 256,
            frameHeight: 256,
            frameCount: 1,
            offsetX: 0
        };
        const shader = unwrap(ShaderRegistry.getShader(WebGL.SNOW_AND_AREA_LIGHT, currentAnim.sprite), "Did not find shader for given template");

        shader.render([
            // Snow shader uniforms
            {
                u_snowHeight: 0.2,
                u_snowThickness: 0.8
            },
            {
                u_lightCount: 0n,
                u_lightSize: [[60], [60]],
                u_lightPos: [[185, 187], [231, 187]],
                u_lightColor: [[0.83137254901961, 0.0156862745098, 0.0156862745098, 1.0], [0.83137254901961, 0.0156862745098, 0.0156862745098, 1.0]], // rgba
                u_ambient: 0.95 //TODO: Change depending on time of day
            }
        ]);

        game.renderer.drawRawCanvasAtWorldPos(
            this.position,
            shader.canvas,
            this.size
        );
    }
}
