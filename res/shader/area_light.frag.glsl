#version 300 es
#define MAX_LIGHTS 8

precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;

uniform int u_lightCount;
/// The ambient light 0-1
uniform float u_ambient;
/// In pixels
uniform float u_lightSize[MAX_LIGHTS];
/// In pixels relative to the texture size, +x -> right +y -> up
uniform vec2 u_lightPos[MAX_LIGHTS];
/// rgb = color, a = intensity
uniform vec4 u_lightColor[MAX_LIGHTS];

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);

    if(texColor.a < 0.01f) {
        fragColor = texColor;
        return;
    }

    vec2 px = gl_FragCoord.xy;

    vec3 totalLight = vec3(u_ambient);
    for(int i = 0; i < MAX_LIGHTS; i++) {
        if(i >= u_lightCount)
            break;

        float radius = max(u_lightSize[i], 1.0f);
        float dist = distance(px, u_lightPos[i]);

        float falloff = 1.0f - smoothstep(0.0f, radius, dist);
        float atten = 1.0f / (1.0f + (dist * dist) / (radius * radius));

        float intensity = falloff * atten * u_lightColor[i].a;

        totalLight += u_lightColor[i].rgb * intensity;
    }

    vec3 finalColor = texColor.rgb * totalLight;
    fragColor = vec4(finalColor, texColor.a);
}