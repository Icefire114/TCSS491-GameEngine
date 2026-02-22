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
    GOD_MODE: false,
    // If true, draw the safezone bounding boxes
    DRAW_SAFEZONE_BB: true,
    // If true, create the entities right in front of the player
    CREATE_TESTING_ENTS: false,
    ENABLE_DEBUG_KEYS: true,
    // If true, player can access armory at anytime by pressing 'p', and can access all guns
    UNLOCK_ALL_GUNS: true
}