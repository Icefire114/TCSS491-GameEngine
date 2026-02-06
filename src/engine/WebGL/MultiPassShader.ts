import { ShaderPass } from "./ShaderPass.js";

export class MultiPassShader {
    public canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private passes: ShaderPass[] = [];
    private baseTexture: WebGLTexture;
    private width: number;
    private height: number;

    constructor(imgElement: HTMLImageElement) {
        this.width = imgElement.naturalWidth || imgElement.width;
        this.height = imgElement.naturalHeight || imgElement.height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.gl = this.canvas.getContext('webgl2', {
            premultipliedAlpha: false,
            alpha: true
        })!;

        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.baseTexture = this.loadTexture(imgElement);
    }

    private loadTexture(imgElement: HTMLImageElement): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgElement);

        return texture;
    }

    addPass(fragmentShaderSource: string): MultiPassShader {
        const pass = new ShaderPass(this.gl, fragmentShaderSource, this.width, this.height);
        this.passes.push(pass);
        return this; // For chaining
    }

    render(uniformsPerPass: any[] = []): void {
        const gl = this.gl;
        gl.viewport(0, 0, this.width, this.height);

        let currentTexture = this.baseTexture;

        for (let i = 0; i < this.passes.length; i++) {
            const isLastPass = i === this.passes.length - 1;
            const uniforms = uniformsPerPass[i] || {};

            // Render this pass
            currentTexture = this.passes[i].render(
                currentTexture,
                isLastPass, // Last pass renders to canvas
                uniforms
            );
        }
    }

    clearPasses() {
        this.passes = [];
    }
}