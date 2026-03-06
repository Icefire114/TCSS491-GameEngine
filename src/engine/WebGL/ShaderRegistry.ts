import { MultiPassShader } from "./MultiPassShader.js";

export interface ShaderTemplate {
    // fragment shader sources
    passes: string[],
    // each sprite src has its own instance of the shader
    instances: Map<string, MultiPassShader>
}


export class ShaderRegistry {
    private static registry: Map<string, ShaderTemplate> = new Map();
    private static canvasInstances: Map<string, MultiPassShader> = new Map();

    /**
     * 
     * @param name The game of the shader pass.
     * @param shaders The fragment shader source code for each pass.
     */
    static registerPassesByName(name: string, shaders: string[]): void {
        if (this.registry.has(name)) return;
        this.registry.set(name, { passes: shaders, instances: new Map() });
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
    static getShader(name: string, source: HTMLImageElement | HTMLCanvasElement): MultiPassShader | undefined {
        const template = this.registry.get(name);
        if (!template) {
            return undefined
        };

        // Canvas sources are keyed by shader name alone (one instance per shader)
        if (source instanceof HTMLCanvasElement) {
            const key = `canvas:${name}`;
            if (!this.canvasInstances.has(key)) {
                const shader = new MultiPassShader(source);
                for (const pass of template.passes) shader.addPass(pass);
                this.canvasInstances.set(key, shader);
            }
            return this.canvasInstances.get(key);
        }

        // Image sources keyed by src as before
        const key = source.src;
        if (!template.instances.has(key)) {
            const shader = new MultiPassShader(source);
            for (const pass of template.passes) shader.addPass(pass);
            template.instances.set(key, shader);
        }
        return template.instances.get(key);
    }
}