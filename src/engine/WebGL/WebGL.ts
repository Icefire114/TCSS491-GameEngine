import { AssetManager, ShaderPath } from "../assetmanager.js";
import { unwrap } from "../util.js";
import { ShaderRegistry } from "./ShaderRegistry.js";

export class WebGL {
    public static readonly CHRISTMAS_TREE = "ChristmasTree";
    public static readonly SNOW_AND_SUN = "SnowAndSun";

    static isWebGL2Supported(): boolean {
        return document.createElement("canvas").getContext("webgl2") !== null;
    }

    static initWebGL(assMan: AssetManager): void {
        ShaderRegistry.registerPassesByName(WebGL.CHRISTMAS_TREE, [
            unwrap(assMan.getShaderSource(new ShaderPath("res/shader/snow.frag.glsl"))),
            unwrap(assMan.getShaderSource(new ShaderPath("res/shader/sun.frag.glsl"))),
            unwrap(assMan.getShaderSource(new ShaderPath("res/shader/christmas_light.frag.glsl"))),
        ]);
        ShaderRegistry.registerPassesByName(WebGL.SNOW_AND_SUN, [
            unwrap(assMan.getShaderSource(new ShaderPath("res/shader/snow.frag.glsl"))),
            unwrap(assMan.getShaderSource(new ShaderPath("res/shader/sun.frag.glsl"))),
        ]);
    }
}