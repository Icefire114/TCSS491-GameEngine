export class ShaderPass {
    protected gl: WebGL2RenderingContext;
    protected program: WebGLProgram;
    protected positionBuffer: WebGLBuffer;
    protected texCoordBuffer: WebGLBuffer;
    protected framebuffer: WebGLFramebuffer | null = null;
    protected outputTexture: WebGLTexture | null = null;
    protected locations: any;


    constructor(gl: WebGL2RenderingContext, fragmentShaderSource: string, w: number, h: number) {
        console.log("[WebGL2] Creating new ShaderPass");

        this.gl = gl;

        const vertexShaderSource = `#version 300 es
            in  vec2 a_position;
            in  vec2 a_texCoord;
            out vec2 v_texCoord;

            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord  = a_texCoord;
            }
        `;
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);

        this.positionBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        this.texCoordBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
        this.setupFramebuffer(w, h);

        // Get uniform locations (common ones)
        this.locations = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord'),
            image: this.gl.getUniformLocation(this.program, 'u_texture'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution')
        };
    }

    render(inputTexture: WebGLTexture, renderToScreen: boolean, uniforms: any = {}): WebGLTexture {
        const gl = this.gl;

        // Bind framebuffer (null = render to canvas)
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderToScreen ? null : this.framebuffer);

        // Clear
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use this pass's program
        gl.useProgram(this.program);

        // Setup attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.locations.texCoord);
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

        // Bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(this.locations.image, 0);

        // Set custom uniforms
        for (const [name, value] of Object.entries(uniforms)) {
            const location = gl.getUniformLocation(this.program, name);
            if (location) {
                if (Array.isArray(value)) {
                    if (value.length === 2) gl.uniform2fv(location, value as number[]);
                    else if (value.length === 3) gl.uniform3fv(location, value as number[]);
                    else if (value.length === 4) gl.uniform4fv(location, value as number[]);
                } else {
                    gl.uniform1f(location, value as number);
                }
            }
        }

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Return the texture we rendered to (for chaining)
        return this.outputTexture!;
    }

    getUniformLocation(name: string): WebGLUniformLocation | null {
        return this.gl.getUniformLocation(this.program, name);
    }


    private setupFramebuffer(width: number, height: number) {
        const gl = this.gl;

        // Create texture to render into
        this.outputTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create framebuffer
        this.framebuffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);

        // Check framebuffer is complete
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Framebuffer not complete');
        }

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this.gl;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
        }

        return program;
    }

    private compileShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            throw new Error('Shader compile error: ' + info);
        }

        return shader;
    }
}