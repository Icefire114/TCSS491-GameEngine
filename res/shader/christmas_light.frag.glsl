#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform float u_time;

// Simple hash function for consistent random values
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1f, 311.7f))) * 43758.5453f);
}

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);

    // Only apply lights to non-transparent pixels
    if(texColor.a < 0.01f) {
        fragColor = texColor;
        return;
    }

    // Create a grid of potential light positions
    vec2 gridPos = v_texCoord * vec2(128.0f, 128.0f); // Adjust density here
    vec2 cellId = floor(gridPos);
    vec2 cellUV = fract(gridPos);

    // Use hash to randomly place lights (not all grid cells get a light)
    float shouldHaveLight = step(0.95f, hash(cellId)); // 5% chance per cell

    // Calculate distance from cell center
    vec2 centerOffset = cellUV - 0.5f;
    float dist = length(centerOffset);

    // Create light bulb shape (only near center of cell)
    float bulbSize = 0.25f;
    float bulb = smoothstep(bulbSize, bulbSize * 0.5f, dist);

    // Random color per light using cell position
    float colorSeed = hash(cellId + vec2(0.5f));
    vec3 lightColor;
    if(colorSeed < 0.25f) {
        lightColor = vec3(1.0f, 0.1f, 0.1f); // Red
    } else if(colorSeed < 0.5f) {
        lightColor = vec3(0.1f, 1.0f, 0.1f); // Green
    } else if(colorSeed < 0.75f) {
        lightColor = vec3(0.1f, 0.5f, 1.0f); // Blue
    } else {
        lightColor = vec3(1.0f, 0.8f, 0.1f); // Yellow/Gold
    }

    // Twinkle effect - each light has its own phase
    float twinklePhase = hash(cellId + vec2(1.0f)) * 6.28f;
    float twinkle = sin(u_time * 3.0f + twinklePhase) * 0.5f + 0.5f;
    twinkle = pow(twinkle, 2.0f); // Make twinkle more pronounced

    // Combine everything
    float lightIntensity = bulb * shouldHaveLight * twinkle;

    // Add glow around the light
    float glowSize = 0.4f;
    float glow = smoothstep(glowSize, 0.0f, dist) * 0.3f;
    glow *= shouldHaveLight * twinkle;

    // Blend light with original texture
    vec3 finalColor = texColor.rgb + (lightColor * lightIntensity * 2.0f) + (lightColor * glow);

    fragColor = vec4(finalColor, texColor.a);
}