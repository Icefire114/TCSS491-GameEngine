import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { Collider } from "../../engine/physics/Collider.js";
import { Vec2 } from "../../engine/types.js";
import { unwrap } from "../../engine/util.js";
import { MultiPassShader } from "../../engine/WebGL/MultiPassShader.js";
import { G_CONFIG } from "../CONSTANTS.js";
import { Mountain } from "../mountain.js";

export class ChristmasTree implements Entity {
    tag: string = "ChristmasTree";
    id: EntityID;

    position: Vec2;
    // trees cant move
    velocity: Vec2 = new Vec2(0, 0);
    // Player does not collide with this, its just a decoration.
    physicsCollider: Collider | null = null;
    sprite: ImagePath = new ImagePath("res/img/world_deco/tree_2.png");
    removeFromWorld: boolean = false;
    animator: Animator = new Animator([
        [
            {
                frameCount: 1,
                frameHeight: 1024,
                frameWidth: 1024,
                sprite: new ImagePath("res/img/world_deco/tree_2.png")
            },
            AnimationState.IDLE
        ]
    ],
        // new Vec2(4, 10)
    );
    shader: MultiPassShader | undefined = undefined;

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const currentAnim = {
            sprite: unwrap(GameEngine.g_INSTANCE.getSprite(this.sprite)),
            frameWidth: 1024,
            frameHeight: 1024,
            frameCount: 1,
            offsetX: 0
        };

        if (this.shader === undefined) {
            this.shader = new MultiPassShader(currentAnim.sprite)
                .addPass(`#version 300 es
                    precision highp float;

                    in vec2 v_texCoord;
                    out vec4 fragColor;

                    uniform sampler2D u_texture;
                    uniform float u_time;
                    uniform float u_snowHeight; // How far down the snow extends (0.0 to 1.0)
                    uniform float u_snowThickness; // Thickness of snow layer (0.0 to 1.0)

                    // Simple noise function
                    float noise(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    void main() {
                        vec4 texColor = texture(u_texture, vec2(v_texCoord.x, 1.0 - v_texCoord.y));
                        
                        // Only apply snow to non-transparent pixels
                        if (texColor.a < 0.01) {
                            fragColor = texColor;
                            return;
                        }
                        
                        // Calculate distance from top (0.0 at top, 1.0 at bottom)
                        float distFromTop = 1.0 - v_texCoord.y;
                        
                        // Create irregular snow edge using noise
                        float noiseValue = noise(v_texCoord * 20.0 + vec2(u_time * 0.1, 0.0));
                        float snowEdge = u_snowHeight + u_snowThickness * (noiseValue - 0.5);
                        
                        // Determine if this pixel should have snow
                        float snowFactor = smoothstep(snowEdge + 0.05, snowEdge - 0.05, distFromTop);
                        
                        // Snow color with slight variations
                        vec3 snowColor = vec3(0.95, 0.97, 1.0);
                        float snowVariation = noise(v_texCoord * 50.0) * 0.1;
                        snowColor += vec3(snowVariation);
                        
                        // Add sparkle effect
                        float sparkle = noise(v_texCoord * 100.0 + vec2(u_time * 0.5, 0.0));
                        sparkle = pow(sparkle, 20.0) * 0.5;
                        snowColor += vec3(sparkle);
                        
                        // Blend original texture with snow
                        vec3 finalColor = mix(texColor.rgb, snowColor, snowFactor);
                        
                        fragColor = vec4(finalColor, texColor.a);
                    }
                `)
                .addPass(`#version 300 es
                    precision mediump float;

                    // --- uniforms -------------------------------------------------------
                    uniform sampler2D u_image;
                    uniform vec2      u_sunDirection; // must be normalized on the CPU side
                    uniform float     u_intensity;    // 0..1
                    uniform float     u_baseLight;    // ambient light level (0..1)
                    uniform float     u_warmth;       // extra warm tint on lit areas

                    // --- inputs ---------------------------------------------------------
                    in vec2 v_texCoord;

                    out vec4 fragColor;

                    void main() {
                        vec4 color = texture(u_image, v_texCoord);
                        
                        // keep transparent pixels untouched
                        if (color.a == 0.0) {
                            fragColor = color;
                            return;
                        }
                        
                        // Convert texture coordinates to centered position (-0.5 to 0.5)
                        vec2 relPos = v_texCoord - 0.5f;
                        
                        // Flip Y to match typical 2D coordinate system where Y+ is up
                        relPos.y = -relPos.y;
                        
                        // Project position onto sun direction to get distance from sun-facing edge
                        // Dot product gives us how far along the sun direction we are
                        float distanceAlongSun = dot(relPos, u_sunDirection);
                        
                        // Convert to 0..1 range where 0 is the sun-facing edge, 1 is the opposite edge
                        // The range of distanceAlongSun is approximately -0.7 to 0.7 (diagonal of 0.5x0.5 square)
                        float edgeFade = 1.0 - (distanceAlongSun + 0.7) / 1.4;
                        edgeFade = clamp(edgeFade, 0.0, 1.0);
                        
                        // basic lighting: ambient + directional based on edge proximity
                        float shadeFactor = u_baseLight + edgeFade * u_intensity;
                        
                        // warm tint on the lit side
                        float warmFactor = edgeFade * u_warmth;
                        vec3 warmTint = vec3(1.0 + warmFactor,
                                            1.0 + warmFactor * 0.5,
                                            1.0);
                        
                        fragColor = vec4(color.rgb * shadeFactor * warmTint, color.a);
                    }
                `);

            console.log("Shader created, canvas size:", this.shader.canvas.width, this.shader.canvas.height);
        }

        const sunAngle = 270; // or calculate based on game time
        const rad = (sunAngle * Math.PI) / 180;
        const sunDir = [Math.cos(rad), Math.sin(rad)];

        this.shader.render([
            // Snow shader uniforms
            {
                // u_time: performance.now() * 0.001,
                u_snowHeight: 0.5,
                u_snowThickness: 0.5
            },
            // Sun shader uniforms
            {
                u_sunDirection: sunDir,
                u_intensity: 0.6,
                u_baseLight: 0,
                u_warmth: 0.6
            },
        ])

        const meterInPixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const worldW = currentAnim.frameWidth / meterInPixels;
        const worldH = currentAnim.frameHeight / meterInPixels;
        const screenW = (worldW * meterInPixels) / game.zoom;
        const screenH = (worldH * meterInPixels) / game.zoom;

        const screenX =
            ((this.position.x - (worldW / 2) - game.viewportX + currentAnim.offsetX) * meterInPixels) / game.zoom;
        const screenY =
            ((this.position.y - worldH - game.viewportY) * meterInPixels) / game.zoom;

        ctx.drawImage(
            this.shader.canvas,
            screenX,
            screenY,
            screenW,
            screenH
        );

    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.position.y = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined)
            .getHeightAt(this.position.x);
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
    }
}
