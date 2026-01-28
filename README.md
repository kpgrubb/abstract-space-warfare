# ABSTRACT SPACE WARFARE
**Ambient Fleet Battle Simulator with Shadow Play Visuals**

## Current Status: Shadow Play Visual Overhaul

### Visual Style
A minimalist "shadow play" aesthetic featuring dark silhouette ships battling on a light background:
- **Friendly Fleet:** Dark warm-grey ships (#4a4035)
- **Enemy Fleet:** Light/white ships (#e8e8e8)
- **Background:** Light grey-white (#f0f0f0)
- **Projectiles:** Near-black for contrast
- **UI:** Dark-themed controls overlay

### Completed Features
- Game engine with requestAnimationFrame loop
- Canvas 2D rendering with shadow play aesthetics
- FPS counter display
- **Full spacecraft fleet with 13 ship classes**
- Multi-hardpoint weapon systems (ballistic, laser, missile, flak)
- Shield systems with regeneration
- Evasion mechanics based on ship size/speed
- Tactical AI with personality traits
- Morale system with routing and last stands
- Victory detection and auto-reset loop
- Particle effects (explosions, impacts, debris)
- Screen shake and visual polish

### Ship Classes

| Class | Role | Size | Speed | Shields |
|-------|------|------|-------|---------|
| **Fighter** | Interceptor/Striker | Tiny | Fastest | None |
| **Interceptor** | Fighter-killer | Tiny | Very Fast | None |
| **Gunship** | Heavy attack | Small | Fast | Light |
| **Frigate** | Escort/Screen | Small | Moderate | None |
| **Corvette** | Electronic Warfare | Small | Fast | Light |
| **Destroyer** | Point Defense | Medium | Fast | Light |
| **Cruiser** | Line Ship | Medium | Moderate | Moderate |
| **Minelayer** | Mine Deployment | Medium | Moderate | Light |
| **Repair Tender** | Fleet Support | Medium | Slow | Moderate |
| **Carrier** | Fighter Deployment | Large | Slow | Heavy |
| **Battleship** | Heavy Anchor | Large | Very Slow | Heavy |
| **Dreadnought** | Super-Capital | Massive | Slowest | Massive |

### How to Run

1. **Open in Browser:**
   - Simply open `index.html` in a modern web browser
   - Or use a local server (recommended):

2. **Using Python:**
   ```bash
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

3. **Using Node.js:**
   ```bash
   npm install -g http-server
   http-server
   ```

4. **Using VS Code:**
   - Install "Live Server" extension
   - Right-click `index.html` and select "Open with Live Server"

### What You Should See

**Setup Screen:**
- Dark-themed configuration UI
- Fleet composition sliders for both sides
- Ship class selection
- "Surprise Me" button for random balanced fleets

**Battle View:**
- Light grey-white background (shadow play aesthetic)
- **Dark friendly ships** vs **Light/white enemy ships**
- Projectile trails and weapon effects
- Shield bubbles on shielded vessels
- Health bars on damaged ships
- Particle explosions on destruction
- Smooth 60fps animation

### Controls

- **Speed Controls:** Adjust simulation speed (0.5x - 4x)
- **Pause/Resume:** Toggle battle pause
- Battle auto-resets after victory

### Architecture

```
abstract-space-warfare/
├── index.html              # Entry point
├── styles/main.css         # UI styling (dark theme)
├── src/
│   ├── main.js             # Application entry
│   ├── core/Engine.js      # Game loop
│   ├── entities/           # Ship classes
│   │   ├── Spacecraft.js   # Base class
│   │   ├── Fighter.js
│   │   ├── Cruiser.js
│   │   ├── Battleship.js
│   │   └── ... (13 ship types)
│   ├── systems/
│   │   ├── Renderer.js     # Canvas drawing
│   │   ├── Combat.js       # Damage resolution
│   │   └── AI.js           # Tactical behavior
│   ├── visual/
│   │   ├── Colors.js       # Color palette
│   │   ├── Particles.js    # Effects system
│   │   └── Projectiles.js  # Weapon visuals
│   └── data/config.js      # Game constants
```

---

**Version:** Shadow Play Visual Overhaul
**Last Updated:** January 28, 2026

---

## Design Philosophy

This simulator aims for an ambient, meditative viewing experience. Fleets engage autonomously with tactical AI making decisions based on:
- Ship roles and capabilities
- Threat assessment
- Morale and damage state
- Personality traits (aggression, discipline, focus)

The shadow play visual style creates a stark, readable battlefield where team identification is immediate and ship movements are easy to follow.
