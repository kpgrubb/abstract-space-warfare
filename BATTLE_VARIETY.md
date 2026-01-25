# Battle Variety & Dramatic AI Features

## Atmosphere System

### Weather Effects
Random weather conditions add visual variety to each battle:

**Rain** (15% chance)
- 200 animated raindrops
- Slanted fall with wind effect
- Blue-tinted particles

**Snow** (10% chance)
- 150 snowflakes
- Gentle falling with wobble/drift
- White particles with varying sizes

**Fog** (10% chance)
- 30 large fog clouds
- Slow horizontal drift
- Semi-transparent gray overlay
- Reduces visibility aesthetically

**Clear** (65% chance)
- No weather particles
- Default visibility

### Time of Day
Random lighting conditions with color overlays:

**Dawn** (15% chance)
- Warm orange/pink overlay
- rgba(255, 180, 120, 0.15)

**Day** (40% chance)
- No color overlay
- Default lighting

**Dusk** (15% chance)
- Purple/pink overlay
- rgba(180, 100, 150, 0.2)

**Night** (30% chance)
- Dark blue overlay
- rgba(20, 20, 60, 0.4)
- Most dramatic visual change

### Integration
- New random atmosphere set at start of each battle
- Weather particles update and render automatically
- Time-of-day overlay applied as post-process effect
- Console logs atmosphere description

---

## Enhanced AI - Dramatic Behaviors

### 1. Heroic Last Stands

**Trigger Conditions:**
- Unit is one of last 3 on their team, AND
- Low health (<30%), OR surrounded (2:1 enemy ratio)

**Effects:**
- Unit stops routing (never retreats)
- +50% damage bonus
- Morale boosted to 60 minimum
- Visual: Pulsing gold/white glow
- Console log: "{team} {type} LAST STAND!"

**Gameplay Impact:**
- Last few units fight desperately
- Can turn tide of battle with damage boost
- Creates dramatic final moments
- Makes routing less effective late-game

### 2. Rally System

**Trigger Conditions (for routing units):**
- No enemies within 200 pixels (safe distance)
- 3+ friendly units nearby (support)
- Morale recovering (>40)
- 20% chance per AI update (0.5s intervals)

**Effects:**
- Routing stops
- Morale set to 55 (shaken but functional)
- Unit returns to combat
- Console log: "{team} {type} rallied!"

**Gameplay Impact:**
- Routing isn't permanent death sentence
- Units can recover if given space
- Encourages pursuing routed units
- More dynamic morale system

### 3. Cavalry Pursuit

**Behavior:**
- Cavalry actively hunts routing enemies
- +500 targeting priority for routing units
- Overrides other tactical priorities
- Pursuit continues until target eliminated

**Visual Indicators:**
- Cavalry motion trails toward fleeing units
- Charge bonus applies to pursuit

**Gameplay Impact:**
- Routing units face higher danger
- Cavalry becomes executioner role
- Historical accuracy (cavalry pursuit phase)
- Makes morale breaks more consequential

### 4. Last Stand Visual Effects

**Gold Pulsing Glow:**
- rgba(255, 220, 100, 0.8-1.0)
- Slower pulse (0.008 frequency)
- Overrides routing red flash
- Applied to all unit types

**Rendering:**
- Infantry: Gold triangle with pulse
- Cavalry: Gold diamond with pulse
- Artillery: Gold hexagon with pulse
- Distinct from routing (red) and charging (trail)

---

## Combat System Enhancements

### Last Stand Damage Bonus
- Applied multiplicatively after rock-paper-scissors
- Applied after flanking bonuses
- Stacks with other modifiers
- +50% increase makes last stands dangerous

### Cavalry Targeting Priority
Priority order (highest to lowest):
1. **Routing units** (+500) - PURSUIT
2. **Artillery** (+300) - Cavalry role
3. **Infantry (not in square)** (+200) - Soft target
4. **Flanking opportunities** (+100-200) - Tactical
5. Other targets

### Morale Integration
- Existing morale penalties still apply
- Last stand overrides routing behavior
- Rally resets morale to functional level
- No changes to morale calculation

---

## Battle Flow with New Features

### Early Battle
- Normal tactical AI
- Formations, flanking, unit priorities
- Morale stable with full forces

### Mid Battle
- Casualties mount
- Some units begin routing
- Cavalry switches to pursuit mode
- Routing units try to escape

### Late Battle
- Last stand triggers (2-3 units left)
- Heroic final resistance
- High damage from desperate units
- Cavalry hunts down survivors
- Possible rallies if pursuit fails

### Victory
- Auto-reset to new battle
- New random atmosphere
- Fresh morale states
- Different weather/lighting

---

## Console Logging

New log messages to watch for:

```
Atmosphere: Rain, Night
{team} {type} LAST STAND!
{team} {type} rallied!
```

Existing logs:
```
=== STARTING BATTLE ===
Battle started: 16 vs 16
=== VICTORY ===
Winner: FRIENDLY
=== AUTO-RESET ===
```

---

## Performance Impact

**Weather Particles:**
- Max 200 rain / 150 snow / 30 fog
- Minimal CPU (simple update loop)
- Canvas 2D rendering (hardware accelerated)

**AI Enhancements:**
- Same 0.5s update interval
- 3 additional checks per unit per update
- Negligible performance cost

**Visual Effects:**
- Pulsing glow uses Date.now() (no extra tracking)
- Rendered same as routing flash
- No additional draw calls

---

## Future Enhancements

**Potential Additions:**
- Commander units (boost nearby morale)
- Unit formations (line, column, wedge)
- Terrain effects on movement
- Banner/standard bearers
- Reinforcement waves
- Defensive positions

**Weather Extensions:**
- Heavy rain (reduced fire rate)
- Blizzard (reduced visibility/movement)
- Thunder/lightning effects
- Wind direction affects projectiles

**Dramatic Moments:**
- Slow-motion on critical hits
- Camera zoom on last stands
- Flash effects on rallies
- Unit voice barks ("Hold the line!")
