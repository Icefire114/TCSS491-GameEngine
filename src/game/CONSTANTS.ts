/**
 * Global config object with feature flags.
 */
export const G_CONFIG = {
    // If true, draw boxes around the physics colliders
    DRAW_PHYSICS_COLLIDERS: true,
    // If true, draw the anchor points for the terrain
    DRAW_TERRAIN_ANCHOR_POINTS: false,
    DRAW_BOSS_ARENA_BB: false,
    // If true, don't generate terrain just a flat plane
    TERRAIN_GENERATION_FORCE_FLAT: false,
    // If true, player does not take damage
    GOD_MODE: true,
    // If true, draw the safezone bounding boxes
    DRAW_SAFEZONE_BB: false,
    // If true, create the entities right in front of the player
    CREATE_TESTING_ENTS: false,
    // If true, enable cheats by pressing 'f' for free fly and 'k' to force death
    ENABLE_DEBUG_KEYS: true,
    // If true, player can access armory at anytime by pressing 'p', and can access all guns
    UNLOCK_ALL_GUNS: true,
    // If true, skip the intro cinematic and start the player in the game
    SKIP_INTRO: false,
    // If true, enable the boss fight and arena
    ENABLE_BOSS_ARENA: true
}