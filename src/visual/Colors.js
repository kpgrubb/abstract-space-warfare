/**
 * Colors.js - Shadow play color palette definitions
 * Dark silhouettes on light background
 */

export const Colors = {
    // Friendly units (warm dark grey)
    FRIENDLY_PRIMARY: '#4a4035',
    FRIENDLY_SECONDARY: '#5a5045',
    FRIENDLY_ACCENT: '#3a3025',

    // Enemy units (cool dark grey)
    ENEMY_PRIMARY: '#354050',
    ENEMY_SECONDARY: '#455060',
    ENEMY_ACCENT: '#253040',

    // Projectiles and effects
    PROJECTILE_FRIENDLY: '#2a2520',
    PROJECTILE_ENEMY: '#202530',
    EXPLOSION: '#1a1a1a',
    IMPACT: '#000000',

    // UI and HUD (kept dark-themed)
    UI_PRIMARY: '#00d4ff',
    UI_SECONDARY: '#0088ff',
    UI_TEXT: '#ffffff',

    // Background
    BACKGROUND: '#f0f0f0',
    GRID: '#e0e0e0',

    // Particles
    SMOKE: '#aaaaaa',
    DEBRIS: '#666666',
    SPARK: '#333333',
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
