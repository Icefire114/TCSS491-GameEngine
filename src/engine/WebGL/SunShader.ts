import { unwrap } from "../util.js";

export class SunShader {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    positionBuffer: WebGLBuffer;
    texCoordBuffer: WebGLBuffer;
    texture: WebGLTexture;
    locations: any;

    constructor(imgElement: HTMLImageElement) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = imgElement.naturalWidth || imgElement.width;
        this.canvas.height = imgElement.naturalHeight || imgElement.height;

        this.gl = unwrap(this.canvas.getContext('webgl2'), "Failed to get WebGL2 context!");
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        this.program = this.gl.createProgram();
        this.texture = this.gl.createTexture();
        this.positionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();

        this.setupShaders();
        this.setupGeometry();
        this.loadTexture(imgElement);
    }

    setupShaders() {
        const gl = this.gl;

        // Vertex shader - positions the image
        const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

        // Fragment shader with warm sun tint
        const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_sunDirection;
  uniform float u_intensity;
  uniform float u_baseLight;
  uniform float u_warmth;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    if (color.a == 0.0) {
      gl_FragColor = color;
      return;
    }
    
    vec2 relPos = (v_texCoord - 0.5) * 2.0;
    float alignment = dot(normalize(relPos), u_sunDirection);
    float shadeFactor = u_baseLight + alignment * u_intensity;
    
    // Add warm tint to lit areas
    float warmFactor = max(0.0, alignment) * u_warmth;
    vec3 warmTint = vec3(1.0 + warmFactor, 1.0 + warmFactor * 0.5, 1.0);
    
    gl_FragColor = vec4(color.rgb * shadeFactor * warmTint, color.a);
  }
`;

        // Compile shaders
        const vertexShader = unwrap(this.compileShader(gl.VERTEX_SHADER, vertexShaderSource), "[WebGL] Failed to compile vertex shader!");
        const fragmentShader = unwrap(this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource), "[WebGL] Failed to compile fragment shader!");

        // Link program
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Program link error: ' + gl.getProgramInfoLog(this.program));
        }

        // Get attribute and uniform locations
        this.locations = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
            image: gl.getUniformLocation(this.program, 'u_image'),
            sunDirection: gl.getUniformLocation(this.program, 'u_sunDirection'),
            intensity: gl.getUniformLocation(this.program, 'u_intensity'),
            baseLight: gl.getUniformLocation(this.program, 'u_baseLight')
        };
    }

    compileShader(type: number, source: string) {
        const gl = this.gl;
        const shader = unwrap(gl.createShader(type), "[WebGL] Failed to create shader!");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compile error: ' + info);
        }

        return shader;
    }

    setupGeometry() {
        const gl = this.gl;

        // Create a rectangle covering the entire canvas
        const positions = new Float32Array([
            -1, -1,  // bottom left
            1, -1,  // bottom right
            -1, 1,  // top left
            1, 1   // top right
        ]);

        const texCoords = new Float32Array([
            0, 1,  // bottom left
            1, 1,  // bottom right
            0, 0,  // top left
            1, 0   // top right
        ]);

        // Position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    }

    loadTexture(imgElement: TexImageSource) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgElement);
    }

    render(sunAngle: number, options = { intensity: 0.3, baseLight: 0.7 }) {
        const gl = this.gl;

        // Convert angle to direction vector
        const rad = (sunAngle * Math.PI) / 180;
        const sunDir = [Math.cos(rad), Math.sin(rad)];

        // Clear canvas
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Use program
        gl.useProgram(this.program);

        // Set up position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

        // Set up texture coordinate attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.locations.texCoord);
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.locations.image, 0);
        gl.uniform2fv(this.locations.sunDirection, sunDir);
        gl.uniform1f(this.locations.intensity, options.intensity);
        gl.uniform1f(this.locations.baseLight, options.baseLight);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

}
