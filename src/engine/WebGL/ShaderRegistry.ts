import { MultiPassShader } from "./MultiPassShader.js";

export interface ShaderTemplate {
    // fragment shader sources
    passes: string[],
    // each sprite src has its own instance of the shader
    instances: Map<string, MultiPassShader>
}


export class ShaderRegistry {
    private static registry: Map<string, ShaderTemplate> = new Map<string, ShaderTemplate>();

    /**
     * 
     * @param name The game of the shader pass.
     * @param shaders The fragment shader source code for each pass.
     */
    static registerPassesByName(name: string, shaders: string[]): void {
        if (this.registry.has(name)) {
            return;
        } else {
            this.registry.set(name, {
                passes: shaders,
                instances: new Map()
            });
        }
    }

    /**
     * Gets a shader for the given sprite, creating it if it doesn't exist, 
     * returning `undefined` if the given shader name could not be found in the registry.
     *
     * @param name The name of the shader
     * @param sprite The sprite to get the shader for
     * @returns The shader pass or `undefined` if the given shader name could 
     * not be found in the registry.
     */
    static getShader(name: string, sprite: HTMLImageElement): MultiPassShader | undefined {
        const template: ShaderTemplate | undefined = this.registry.get(name);
        if (!template) {
            return undefined;
        }
        const spriteSrc = sprite.src;
        if (!template.instances.has(spriteSrc)) {
            const shader: MultiPassShader = new MultiPassShader(sprite);
            for (const pass of template.passes) {
                shader.addPass(pass);
            }
            template.instances.set(spriteSrc, shader);
        }

        return template.instances.get(spriteSrc);
    }
}