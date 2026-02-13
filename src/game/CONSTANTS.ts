/**
 * Global config object with feature flags.
 */
export const G_CONFIG = {
    // If true, draw boxes around the physics colliders
    DRAW_PHYSICS_COLLIDERS: true,
    // If true, draw the anchor points for the terrain
    DRAW_TERRAIN_ANCHOR_POINTS: false,
    // If true, don't generate terrain just a flat plane
    TERRAIN_GENERATION_FORCE_FLAT: false,
    // If true, player does not take damage
    GOD_MODE: true,
    // If true, use the new renderer, else use the old renderer
    NEW_RENDERER: false,
    // If true, draw the safezone bounding boxes
    DRAW_SAFEZONE_BB: true
}