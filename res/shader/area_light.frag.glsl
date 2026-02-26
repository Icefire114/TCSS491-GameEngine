#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;

/// In pixels
uniform float u_lightSize;
/// In pixels (screen space)
uniform vec2 u_lightPos;
/// rgb = color, a = intensity
uniform vec4 u_lightColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);

    // Early out for transparent pixels
    if(texColor.a < 0.01f) {
        fragColor = texColor;
        return;
    }

    vec2 px = gl_FragCoord.xy;
    float dist = distance(px, u_lightPos);

    float radius = max(u_lightSize, 1.0f);

    // Smooth radial falloff
    float falloff = 1.0f - smoothstep(0.0f, radius, dist);

    // Softer inverse-square style attenuation
    float atten = 1.0f / (1.0f + (dist * dist) / (radius * radius));

    float intensity = falloff * atten * u_lightColor.a;

    // Small ambient term to prevent total black
    float ambient = 0.15f;

    vec3 light = u_lightColor.rgb * intensity;
    vec3 finalColor = texColor.rgb * (ambient + light);

    fragColor = vec4(finalColor, texColor.a);
}