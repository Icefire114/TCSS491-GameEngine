export class ShaderEngine {
    static isWebGL2Supported(): boolean {
        return document.createElement("canvas").getContext("webgl2") !== null;
    }
}