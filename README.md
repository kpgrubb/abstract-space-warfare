# ABSTRACT WARFARE
**Ambient Napoleonic Battle Simulator with Neon Geometric Visuals**

## Current Status: Enhanced Polish & Battle Variety 🎨🎵⚔️

### Completed Features
- ✅ Game engine with requestAnimationFrame loop
- ✅ Canvas 2D rendering system with neon glow effects
- ✅ FPS counter display
- ✅ Base Unit class with movement system
- ✅ Infantry units (neon blue triangles for friendly, red for enemy)
- ✅ Vector math utilities
- ✅ Moving units with smooth animation
- ✅ **Combat system with targeting and firing**
- ✅ **Visible projectiles with travel and trails**
- ✅ **Particle effects system**
- ✅ **Muzzle flashes, impact effects, and death explosions**
- ✅ **Health system and unit elimination**
- ✅ **Battle resolution (one side wins)**
- ✅ **Cavalry units (diamonds) with charging behavior**
- ✅ **Artillery units (hexagons) with long-range arcing shots**
- ✅ **Motion trails for cavalry charges**
- ✅ **Arcing projectile trajectories for artillery**
- ✅ **Rock-paper-scissors combat mechanics**
- ✅ **Tactical AI with target prioritization**
- ✅ **Morale system - units lose morale when isolated, outnumbered, or wounded**
- ✅ **Routing behavior - low morale units flee the battlefield**
- ✅ **Defensive square formations - infantry forms squares vs cavalry**
- ✅ **Flanking bonuses - rear and flank attacks deal extra damage**
- ✅ **Unit cohesion - units fight better near friendlies**
- ✅ **Tactical positioning - cavalry seeks flanks, artillery retreats from threats**
- ✅ **Battle setup UI - customize army composition with sliders**
- ✅ **"Surprise Me" button - instant random balanced battles**
- ✅ **Preset scenarios - Cavalry Clash, Artillery Duel, Last Stand, Meeting Engagement**
- ✅ **Deployment patterns - Line, Column, Defensive, Scattered formations**
- ✅ **Battle configuration system - save and replay setups**
- ✅ **Victory detection - automatic winner determination**
- ✅ **Victory announcement overlay - flashing text with battle statistics**
- ✅ **Battle statistics - casualties, survivors, duration tracking**
- ✅ **Auto-reset loop - seamless transition to next battle**
- ✅ **Infinite ambient mode - runs perpetually with same configuration**
- ✅ **Screen shake effects - artillery impacts shake the camera**
- ✅ **Scorch marks - persistent ground damage from explosions**
- ✅ **Vignette post-processing - subtle edge darkening**
- ✅ **Cyberpunk audio atmosphere - deep electronic drone soundtrack**
- ✅ **Procedural sound effects - musket fire, artillery booms, death sounds**
- ✅ **Weather system - rain, snow, fog effects (random per battle)**
- ✅ **Time of day - dawn, day, dusk, night lighting (random per battle)**
- ✅ **Heroic last stands - final units fight with +50% damage bonus**
- ✅ **Rally system - routing units can recover with support**
- ✅ **Cavalry pursuit - cavalry hunts down fleeing enemies**
- ✅ **Last stand visual - gold pulsing glow on desperate units**

### How to Run

1. **Open in Browser:**
   - Simply open `index.html` in a modern web browser
   - Or use a local server (recommended):

2. **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

3. **Using Node.js:**
   ```bash
   # Install http-server globally
   npm install -g http-server
   # Run server
   http-server
   ```

4. **Using VS Code:**
   - Install "Live Server" extension
   - Right-click `index.html` and select "Open with Live Server"

### What You Should See

**Setup Screen:**
- Sleek neon-themed configuration UI on startup
- Large "⚡ Surprise Me" button for instant battles
- Sliders to customize Infantry (5-50), Cavalry (0-20), Artillery (0-10) for both sides
- 4 preset scenarios with themed compositions
- Real-time unit count totals

**Battle View:**
- Black canvas with neon cyan FPS counter in top-right
- **Random atmosphere each battle**: Rain, snow, fog, or clear weather / Dawn, day, dusk, or night lighting
- **Mixed armies: 8 Infantry (triangles) + 5 Cavalry (diamonds) + 3 Artillery (hexagons) per side**
- **Blue (friendly) vs Red/Orange (enemy) units**
- **Infantry firing straight projectiles with trails**
- **Cavalry charging with glowing motion trails**
- **Artillery firing spectacular ARCING shots across the battlefield**
- **Screen shakes violently on artillery impacts**
- **Dark scorch marks persist on ground where shells explode**
- **Muzzle flash particles when units fire**
- **Impact bursts when projectiles hit**
- **Spectacular death explosions with debris and smoke**
- **Deep electronic ambient soundtrack** (auto-starts)
- **Tactical combat**: Cavalry hunts artillery, artillery devastates cavalry, infantry holds the line
- **Morale dynamics**: Watch units form defensive squares, routing units flee with red flashing
- **Heroic last stands**: Final 3 units glow GOLD and fight with +50% damage
- **Cavalry pursuit**: Horsemen chase down routing enemies relentlessly
- **Rally attempts**: Fleeing units can recover if given space and support
- **Flanking maneuvers**: Cavalry circles to attack from the rear for massive damage
- **Dynamic battles**: Units react to threats, maintain cohesion, and make tactical decisions
- **Battle continues until one side is eliminated or routs completely**
- Smooth 60fps animation with hundreds of particles, complex trajectories, and emergent tactics

### Debug Console

Open browser console (F12) and type:
```javascript
ABSTRACT_WARFARE.getDebugInfo()
```

This will show:
- Current FPS
- Entity count
- System count

### Future Enhancements

- HUD overlay with real-time battle statistics
- Camera controls (pan, zoom, tracking modes)
- Keyboard shortcuts (pause, speed control, screenshot)
- Named units with persistence across battles
- Time limit victory conditions
- Terrain variations with tactical effects
- Sound effects and procedural music

### Controls (Coming Later)

Currently no user controls - this is an ambient simulation.

Future phases will add:
- Pause/Resume (Spacebar)
- Speed controls (1-4 keys)
- Camera pan (Click-drag)
- Camera zoom (Mouse wheel)
- Toggle HUD (H key)

---

**Version:** Phase 6 - Victory & Auto-Reset Loop (MVP Complete!)
**Last Updated:** January 15, 2026

---

## Unit Types

### Infantry (Triangles)
- **Role:** Backbone of the army, steady firepower
- **Speed:** Moderate (40 px/s)
- **Range:** Medium (150 px)
- **Damage:** 15
- **Special:** Can form defensive squares (not yet implemented)
- **Strong vs:** Artillery
- **Weak vs:** Cavalry (unless in square)
- **AI Behavior:** Forms defensive squares when cavalry nearby, maintains cohesion with nearby infantry

### Cavalry (Diamonds)
- **Role:** Fast shock troops, devastating charges
- **Speed:** Fast (120 px/s, 200 px/s when charging)
- **Range:** Melee (20 px)
- **Damage:** 30 (40 during charge)
- **Special:** Motion trails, charging behavior
- **Strong vs:** Infantry (in open), Artillery
- **Weak vs:** Infantry (in square), Artillery fire
- **AI Behavior:** Seeks flanking positions, charges vulnerable targets, prioritizes artillery and exposed infantry

### Artillery (Hexagons)
- **Role:** Long-range support, area denial
- **Speed:** Very slow (15 px/s)
- **Range:** Very long (400 px)
- **Damage:** 25 (with area effect potential)
- **Special:** Arcing projectiles, reload animation, pulsing when ready
- **Strong vs:** Cavalry, massed infantry
- **Weak vs:** Close combat, cavalry charges
- **AI Behavior:** Maintains maximum range, retreats when enemies get too close, prioritizes cavalry targets
