#version 300 es
precision highp float;

// --- uniforms -------------------------------------------------------
uniform sampler2D u_image;
uniform vec2 u_sunDirection; // must be normalized on the CPU side
uniform float u_intensity;    // 0..1
uniform float u_baseLight;    // ambient light level (0..1)
uniform float u_warmth;       // extra warm tint on lit areas
 // only used when the sprite the shader is being appliced to is animated
uniform int u_spriteSheetOffsetX;
uniform int u_spriteSheetOffsetY;
// --- inputs ---------------------------------------------------------
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec4 color = texture(u_image, v_texCoord + vec2(u_spriteSheetOffsetX, u_spriteSheetOffsetY));

    // keep transparent pixels untouched
    if(color.a == 0.0f) {
        fragColor = color;
        return;
    }

    // Convert texture coordinates to centered position (-0.5 to 0.5)
    vec2 relPos = ((v_texCoord + vec2(u_spriteSheetOffsetX, u_spriteSheetOffsetY)) - 0.5f) * 2.0f;
    relPos = relPos + vec2(-0.4f, -((v_texCoord + vec2(u_spriteSheetOffsetX, u_spriteSheetOffsetY))).y * 0.9f);
    float edgeFade = dot(normalize(relPos), u_sunDirection);
    edgeFade = clamp(edgeFade, 0.0f, 1.0f);
    float alignment = dot(normalize(relPos), u_sunDirection);
    float shadeFactor = u_baseLight + (edgeFade * u_intensity) + (alignment * u_intensity);

    // basic lighting: ambient + directional based on edge proximity
    // float shadeFactor = u_baseLight + edgeFade * u_intensity;

    // warm tint on the lit side
    float warmFactor = max(0.0f, alignment) * u_warmth;
    vec3 warmTint = vec3(1.0f + warmFactor, 1.0f + warmFactor * 0.5f, 1.0f);

    fragColor = vec4(color.rgb * shadeFactor * warmTint, color.a);
}