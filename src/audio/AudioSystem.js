/**
 * AudioSystem.js - Procedural sci-fi audio atmosphere
 * Uses Web Audio API for synthesized space combat sounds
 */

export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        this.enabled = true;
        this.masterVolume = 0.6;
        this.musicVolume = 0.25;
        this.sfxVolume = 0.5;

        // Ambient music state
        this.ambientOscillators = [];
        this.musicPlaying = false;

        // Initialize on user interaction
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);

            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.initialized = true;
            console.log('Audio system initialized');

            // Start ambient music
            this.startAmbientMusic();
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }

    /**
     * Start space ambient music
     * Deep, evolving electronic soundscape
     */
    startAmbientMusic() {
        if (!this.initialized || this.musicPlaying) return;

        const now = this.audioContext.currentTime;

        // Deep space drone (very low fundamental)
        const deepBass = this.audioContext.createOscillator();
        deepBass.type = 'sine';
        deepBass.frequency.value = 30; // Very deep
        const deepGain = this.audioContext.createGain();
        deepGain.gain.value = 0.25;
        deepBass.connect(deepGain);
        deepGain.connect(this.musicGain);
        deepBass.start(now);
        this.ambientOscillators.push(deepBass);

        // Space hum (ship ambience)
        const hum = this.audioContext.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 60;
        const humGain = this.audioContext.createGain();
        humGain.gain.value = 0.12;
        hum.connect(humGain);
        humGain.connect(this.musicGain);
        hum.start(now);
        this.ambientOscillators.push(hum);

        // Ethereal pad (evolving)
        const pad = this.audioContext.createOscillator();
        pad.type = 'sine';
        pad.frequency.value = 220;

        // Add slow LFO for frequency modulation
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05; // Very slow
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 15; // ±15Hz modulation
        lfo.connect(lfoGain);
        lfoGain.connect(pad.frequency);

        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.08;

        // Filter for softness
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 2;

        pad.connect(filter);
        filter.connect(padGain);
        padGain.connect(this.musicGain);
        pad.start(now);
        lfo.start(now);
        this.ambientOscillators.push(pad);
        this.ambientOscillators.push(lfo);

        // High shimmer (stars)
        const shimmer = this.audioContext.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 880;

        const shimmerLfo = this.audioContext.createOscillator();
        shimmerLfo.type = 'sine';
        shimmerLfo.frequency.value = 0.2;
        const shimmerLfoGain = this.audioContext.createGain();
        shimmerLfoGain.gain.value = 0.03;
        shimmerLfo.connect(shimmerLfoGain);

        const shimmerGain = this.audioContext.createGain();
        shimmerGain.gain.value = 0.03;
        shimmerLfoGain.connect(shimmerGain.gain);

        shimmer.connect(shimmerGain);
        shimmerGain.connect(this.musicGain);
        shimmer.start(now);
        shimmerLfo.start(now);
        this.ambientOscillators.push(shimmer);
        this.ambientOscillators.push(shimmerLfo);

        this.musicPlaying = true;
        console.log('Space ambient music started');
    }

    /**
     * Stop ambient music
     */
    stopAmbientMusic() {
        for (const osc of this.ambientOscillators) {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        }
        this.ambientOscillators = [];
        this.musicPlaying = false;
    }

    /**
     * Play ballistic weapon fire sound
     */
    playBallisticFire(spatial = 0) {
        if (!this.initialized || !this.enabled) return;

        const now = this.audioContext.currentTime;

        // Sharp click + brief noise
        const click = this.audioContext.createOscillator();
        click.type = 'square';
        click.frequency.setValueAtTime(800, now);
        click.frequency.exponentialRampToValueAtTime(200, now + 0.05);

        const clickGain = this.audioContext.createGain();
        clickGain.gain.setValueAtTime(0.12, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        // Brief noise burst
        const bufferSize = this.audioContext.sampleRate * 0.04;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const decay = 1 - (i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * decay * decay;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.08;

        // Spatial panning
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, spatial));

        click.connect(clickGain);
        noise.connect(filter);
        filter.connect(noiseGain);

        clickGain.connect(panner);
        noiseGain.connect(panner);
        panner.connect(this.sfxGain);

        click.start(now);
        noise.start(now);
        click.stop(now + 0.05);
        noise.stop(now + 0.04);
    }

    /**
     * Play laser weapon sound
     */
    playLaserFire(spatial = 0) {
        if (!this.initialized || !this.enabled) return;

        const now = this.audioContext.currentTime;

        // Classic laser "pew" - high frequency sweep down
        const laser = this.audioContext.createOscillator();
        laser.type = 'sawtooth';
        laser.frequency.setValueAtTime(2500, now);
        laser.frequency.exponentialRampToValueAtTime(400, now + 0.15);

        const laserGain = this.audioContext.createGain();
        laserGain.gain.setValueAtTime(0.1, now);
        laserGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        // Filter for smoothness
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);

        // Spatial panning
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, spatial));

        laser.connect(filter);
        filter.connect(laserGain);
        laserGain.connect(panner);
        panner.connect(this.sfxGain);

        laser.start(now);
        laser.stop(now + 0.15);
    }

    /**
     * Play missile launch sound
     */
    playMissileLaunch(spatial = 0) {
        if (!this.initialized || !this.enabled) return;

        const now = this.audioContext.currentTime;

        // Whoosh sound - noise with frequency sweep
        const bufferSize = this.audioContext.sampleRate * 0.4;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const envelope = Math.sin(t * Math.PI) * (1 - t * 0.5);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        filter.Q.value = 3;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // Spatial panning
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, spatial));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.4);
    }

    /**
     * Play explosion sound (ship destruction)
     */
    playExplosion(spatial = 0, size = 1.0) {
        if (!this.initialized || !this.enabled) return;

        const now = this.audioContext.currentTime;
        const duration = 0.4 + size * 0.3;

        // Deep bass thump
        const bass = this.audioContext.createOscillator();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(100 / size, now);
        bass.frequency.exponentialRampToValueAtTime(30, now + duration);

        const bassGain = this.audioContext.createGain();
        bassGain.gain.setValueAtTime(0.5 * size, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Mid-range crunch
        const crunch = this.audioContext.createOscillator();
        crunch.type = 'square';
        crunch.frequency.setValueAtTime(300, now);
        crunch.frequency.exponentialRampToValueAtTime(50, now + 0.2);

        const crunchGain = this.audioContext.createGain();
        crunchGain.gain.setValueAtTime(0.25 * size, now);
        crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        // Debris noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const decay = Math.pow(1 - t, 2);
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.35 * size, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Spatial panning
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, spatial));

        // Connect everything
        bass.connect(bassGain);
        crunch.connect(crunchGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        bassGain.connect(panner);
        crunchGain.connect(panner);
        noiseGain.connect(panner);
        panner.connect(this.sfxGain);

        // Start sounds
        bass.start(now);
        crunch.start(now);
        noise.start(now);

        bass.stop(now + duration);
        crunch.stop(now + 0.2);
        noise.stop(now + duration);
    }

    /**
     * Play ship destroyed sound
     */
    playShipDestroyed(spatial = 0, shipSize = 1.0) {
        // Map ship size to explosion intensity
        // fighter = 0.5, frigate = 0.7, cruiser = 1.0, carrier = 1.3, battleship = 1.5
        this.playExplosion(spatial, shipSize);
    }

    /**
     * Play impact sound (projectile hit)
     */
    playImpact(spatial = 0, weaponType = 'ballistic') {
        if (!this.initialized || !this.enabled) return;

        const now = this.audioContext.currentTime;

        if (weaponType === 'laser') {
            // Electric sizzle for laser
            const osc = this.audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1500, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            const panner = this.audioContext.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, spatial));

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.1);
        } else if (weaponType === 'missile') {
            // Small explosion for missile
            this.playExplosion(spatial, 0.6);
        } else {
            // Metallic ping for ballistic
            const osc = this.audioContext.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            const panner = this.audioContext.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, spatial));

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.08);
        }
    }

    /**
     * Calculate spatial position (-1 to 1) from x coordinate
     */
    getSpatialPosition(x, canvasWidth) {
        return (x / canvasWidth) * 2 - 1;
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAmbientMusic();
        } else if (this.initialized) {
            this.startAmbientMusic();
        }
        return this.enabled;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopAmbientMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
