import { Background } from "../../worldBackground/Background.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { ImagePath } from "../../../engine/assetmanager.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { WebGL } from "../../../engine/WebGL/WebGL.js";
import { ShaderRegistry } from "../../../engine/WebGL/ShaderRegistry.js";
import { clamp, unwrap } from "../../../engine/util.js";
import { DayNightCycle } from "../../worldBackground/DayNightCycle.js";

export class safeZoneBackground extends Background {

    public size: Vec2 = new Vec2();

    constructor(pos: Vec2, width: number) {
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
        const dnc: DayNightCycle = unwrap(game.getUniqueEntityByTag("DayNightCycle")) as DayNightCycle;
        /**
         * Maps cycle time to a number like so:
         * \left(\frac{1+\cos\left(2\pi\left(x-0.25\right)\right)}{2}\right)^{1.3} (its TeX so use something nice to render it)
         * https://www.desmos.com/calculator/svjimn17wv
         */
        const ambient = Math.pow((1 + Math.cos(2 * Math.PI * (dnc.cycleTime - 0.25))) / 2, 1.3)
        const MIN_BRIGHTNESS = 0.2;
        const brightness = ambient + MIN_BRIGHTNESS * (1 - clamp(2 * ambient, 0, 1));
        shader.render([
            // Snow shader uniforms
            {
                u_snowHeight: 0.2,
                u_snowThickness: 0.8
            },
            {
                u_lightCount: 0n,
                u_lightSize: [],
                u_lightPos: [],
                u_lightColor: [], // rgba
                u_ambient: brightness
            }
        ]);

        game.renderer.drawRawCanvasAtWorldPos(
            this.position,
            shader.canvas,
            this.size
        );
    }
}
