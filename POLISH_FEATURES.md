# Visual Polish & Audio Features

## Visual Effects Added

### 1. Screen Shake System (`ScreenEffects.js`)
- Camera shake on artillery impacts (intensity: 0.8)
- Smooth decay over time
- Applied to entire canvas during render
- Flash effects system (for future use)
- Vignette post-processing (dark edges)

### 2. Scorch Marks (`ScorchMarks.js`)
- Persistent ground damage from artillery explosions
- 30px radius burn marks
- Fade over time (15% per second)
- Maximum 50 marks on battlefield
- Rendered as ground layer (before units)

### 3. Enhanced Particle System
- Existing smoke effects already in place
- Larger impact particles for artillery (20 vs 6)
- Death explosions with debris

## Audio System (`AudioSystem.js`)

### Cyberpunk Ambient Music
- Deep bass drone (55Hz fundamental)
- Sub-bass layer (27.5Hz) for depth
- Harmonic triangle wave with LFO modulation
- High atmospheric pad with lowpass filter
- Dark, evolving soundscape
- Starts automatically on first battle

### Procedural Sound Effects
1. **Musket Fire**
   - Noise burst with bandpass filter
   - 800-1200Hz range
   - 0.1s duration
   - Plays on infantry/cavalry fire

2. **Artillery Explosion**
   - Deep bass thump (120Hz → 40Hz)
   - Mid-range crack (200Hz square wave)
   - Noise burst layer
   - 0.5s duration with envelope
   - Plays on artillery impact

3. **Unit Death**
   - Metallic clang (400Hz → 100Hz)
   - 0.3s duration
   - Plays when unit destroyed

### Audio Controls
- Master volume: 60%
- Music volume: 30%
- SFX volume: 50%
- All adjustable via API
- Toggle on/off with `.toggle()`

## Integration

### Combat System
- Artillery impacts trigger:
  - Screen shake (0.8 intensity)
  - Scorch mark (30px radius)
  - Explosion sound
  - Large particle burst (20 particles)

- Musket fire triggers:
  - Firing sound
  - Standard particle burst

- Unit death triggers:
  - Death sound
  - Death explosion particles

### Engine Rendering Order
1. Clear canvas
2. Apply screen shake transform
3. Render scorch marks (ground layer)
4. Render units
5. Render projectiles
6. Render particles
7. Restore canvas (remove shake)
8. Render post-processing (vignette, flash)

### Battle Lifecycle
- Audio initialized on first user interaction (button click)
- Ambient music starts immediately
- Scorch marks cleared between battles
- Effects persist during battle, fade naturally

## Performance Notes
- Maximum 50 scorch marks (FIFO removal)
- Maximum 1000 particles (existing limit)
- Audio uses Web Audio API (hardware accelerated)
- Screen shake uses canvas transform (efficient)
- Vignette uses radial gradient (cached by browser)

## Future Enhancements
- Spatial audio (panning based on unit position) - partially implemented
- Flash effects on victory/defeat
- Weather-based audio variations
- Dynamic music intensity based on battle state
