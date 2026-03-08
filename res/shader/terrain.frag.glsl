#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_viewportOffset;
uniform float u_time;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898f, 78.233f))) * 43758.5453f);
}

// Smooth value noise - interpolates between random values
float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Cubic smoothstep interpolation
    vec2 u = f * f * (3.0f - 2.0f * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0f, 0.0f));
    float c = hash(i + vec2(0.0f, 1.0f));
    float d = hash(i + vec2(1.0f, 1.0f));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion - layers of smooth noise for organic shapes
float fbm(vec2 p) {
    float value = 0.0f;
    float amplitude = 0.5f;
    float frequency = 1.0f;

    for(int i = 0; i < 4; i++) {
        value += amplitude * smoothNoise(p * frequency);
        amplitude *= 0.5f;
        frequency *= 2.0f;
    }
    return value;
}

void main() {
    vec4 texColor = texture(u_texture, vec2(v_texCoord.x, 1.0f - v_texCoord.y));

    if(texColor.a < 0.1f) {
        fragColor = texColor;
        return;
    }

    vec2 worldCoord = v_texCoord + u_viewportOffset;

    // FBM at low frequency = large, billowy snow bank shapes
    float noiseValue = fbm(worldCoord * 50.0f + vec2(u_time * 0.05f, 0.0f));
    float snowEdge = 1.0f + (noiseValue - 0.5f);

    // Soft edge for a pillowy look
    float snowFactor = smoothstep(snowEdge + 0.08f, snowEdge - 0.08f, 1.0f);

    // Snow color with gentle smooth variation
    vec3 snowColor = vec3(0.95f, 0.97f, 1.0f);
    float snowVariation = smoothNoise(worldCoord * 4.0f) * 0.08f;
    snowColor -= vec3(snowVariation); // Subtle shadowing in the dips

    // Soft sparkle using smooth noise instead of hash
    float sparkle = smoothNoise(worldCoord * 30.0f + vec2(u_time * 0.3f, 0.0f));
    sparkle = pow(sparkle, 8.0f) * 0.4f;
    snowColor += vec3(sparkle);

    vec3 finalColor = mix(texColor.rgb, snowColor, snowFactor * 0.55f);
    fragColor = vec4(finalColor, texColor.a);
}