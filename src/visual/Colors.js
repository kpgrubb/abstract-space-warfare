/**
 * Colors.js - Neon color palette definitions
 */

export const Colors = {
    // Friendly units (blue/cyan)
    FRIENDLY_PRIMARY: '#00d4ff',      // Bright cyan
    FRIENDLY_SECONDARY: '#0088ff',    // Electric blue
    FRIENDLY_ACCENT: '#00ffff',       // Pure cyan

    // Enemy units (red/orange)
    ENEMY_PRIMARY: '#ff3366',         // Neon pink-red
    ENEMY_SECONDARY: '#ff6600',       // Bright orange
    ENEMY_ACCENT: '#ff0044',          // Pure red

    // Projectiles and effects
    PROJECTILE_FRIENDLY: '#66e0ff',   // Light cyan
    PROJECTILE_ENEMY: '#ff8899',      // Light red
    EXPLOSION: '#ffaa00',             // Bright orange
    IMPACT: '#ffffff',                // White flash

    // UI and HUD
    UI_PRIMARY: '#00d4ff',            // Cyan
    UI_SECONDARY: '#0088ff',          // Blue
    UI_TEXT: '#ffffff',               // White

    // Background
    BACKGROUND: '#0a0a0a',            // Near black
    GRID: '#1a1a1a',                  // Dark gray

    // Particles
    SMOKE: '#555555',                 // Gray
    DEBRIS: '#888888',                // Light gray
    SPARK: '#ffff88',                 // Yellow-white
};

/**
 * Get random variation of a color
 */
export function colorVariation(color, variance = 20) {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    r = Math.max(0, Math.min(255, r + Math.random() * variance * 2 - variance));
    g = Math.max(0, Math.min(255, g + Math.random() * variance * 2 - variance));
    b = Math.max(0, Math.min(255, b + Math.random() * variance * 2 - variance));

    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}
