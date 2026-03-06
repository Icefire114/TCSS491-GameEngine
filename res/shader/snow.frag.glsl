#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
// Only used by mountain shader
uniform vec2 u_viewportOffset;
uniform float u_time;
uniform float u_snowHeight; // How far down the snow extends (0.0 to 1.0)
uniform float u_snowThickness; // Thickness of snow layer (0.0 to 1.0)

// Simple noise function
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898f, 78.233f))) * 43758.5453f);
}

void main() {
    vec4 texColor = texture(u_texture, vec2(v_texCoord.x, 1.0f - v_texCoord.y));

    // Only apply snow to non-transparent pixels
    if(texColor.a < 0.1f) {
        fragColor = texColor;
        return;
    }

    // Offset tex coord by viewport so noise is in world space
    vec2 worldCoord = v_texCoord + u_viewportOffset;

    // Calculate distance from top (0.0 at top, 1.0 at bottom)
    float distFromTop = 1.0f - v_texCoord.y;

    // Create irregular snow edge using noise
    float noiseValue = noise(worldCoord * 20.0f + vec2(u_time * 0.1f, 0.0f));
    float snowEdge = u_snowHeight + u_snowThickness * (noiseValue - 0.5f);

    // Determine if this pixel should have snow
    float snowFactor = smoothstep(snowEdge + 0.05f, snowEdge - 0.05f, distFromTop);

    // Snow color with slight variations
    vec3 snowColor = vec3(0.95f, 0.97f, 1.0f);
    float snowVariation = noise(worldCoord * 50.0f) * 0.1f;
    snowColor += vec3(snowVariation);

    // Add sparkle effect
    float sparkle = noise(worldCoord * 100.0f + vec2(u_time * 0.5f, 0.0f));
    sparkle = pow(sparkle, 20.0f) * 0.5f;
    snowColor += vec3(sparkle);

    // Blend original texture with snow
    vec3 finalColor = mix(texColor.rgb, snowColor, snowFactor * 0.55f);

    fragColor = vec4(finalColor, texColor.a);
}