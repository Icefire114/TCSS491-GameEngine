#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform float u_time;
uniform float u_lightSize;
/// In pixels
uniform vec2 u_lightPos;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);

    if(texColor.a < 0.01f) {
        fragColor = texColor;
        return;
    }
}