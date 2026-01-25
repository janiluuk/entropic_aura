/**
 * AudioMixer - Handles real-time audio mixing with crossfading
 * Uses Web Audio API to smoothly transition between audio sources
 */

export class AudioMixer {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
    this.currentGain = null;
    this.nextSource = null;
    this.nextGain = null;
    this.crossfadeDuration = 5; // Default 5 seconds
    this.audioSources = new WeakMap(); // Track which audio elements have sources
  }

  /**
   * Initialize the audio context
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Set crossfade duration
   * @param {number} duration - Duration in seconds
   */
  setCrossfadeDuration(duration) {
    this.crossfadeDuration = Math.max(0, Math.min(30, duration));
  }

  /**
   * Start playing an audio element
   * @param {HTMLAudioElement} audioElement - Audio element to play
   * @returns {Object} Source and gain nodes
   */
  playAudio(audioElement) {
    if (!this.audioContext) {
      this.init();
    }

    // Check if we already have a source for this element
    let source = this.audioSources.get(audioElement);
    
    if (!source) {
      // Create source from audio element only if not already created
      source = this.audioContext.createMediaElementSource(audioElement);
      this.audioSources.set(audioElement, source);
    }
    
    const gain = this.audioContext.createGain();
    
    // Connect: source -> gain -> destination
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    
    // Start with full volume
    gain.gain.value = 1.0;
    
    return { source, gain };
  }

  /**
   * Crossfade from current audio to next audio
   * @param {HTMLAudioElement} nextAudioElement - Next audio element
   * @param {Object} currentNodes - Current source and gain nodes
   * @returns {Promise} Resolves when crossfade completes
   */
  async crossfade(nextAudioElement, currentNodes = null) {
    if (!this.audioContext) {
      this.init();
    }

    // If no crossfade duration, just switch immediately
    if (this.crossfadeDuration === 0) {
      if (currentNodes && currentNodes.gain) {
        currentNodes.gain.gain.value = 0;
      }
      return this.playAudio(nextAudioElement);
    }

    // Create next audio source
    const nextNodes = this.playAudio(nextAudioElement);
    const { gain: nextGain } = nextNodes;
    
    // Start next audio at 0 volume
    nextGain.gain.value = 0;
    
    // Start playing the next audio
    nextAudioElement.play();

    // Calculate ramp time
    const now = this.audioContext.currentTime;
    const endTime = now + this.crossfadeDuration;

    // Fade out current audio (if exists)
    if (currentNodes && currentNodes.gain) {
      currentNodes.gain.gain.linearRampToValueAtTime(0, endTime);
    }

    // Fade in next audio
    nextGain.gain.linearRampToValueAtTime(1.0, endTime);

    // Wait for crossfade to complete
    await new Promise(resolve => {
      setTimeout(resolve, this.crossfadeDuration * 1000);
    });

    // Clean up old audio
    if (currentNodes && currentNodes.gain) {
      currentNodes.gain.disconnect();
      if (currentNodes.source) {
        currentNodes.source.disconnect();
      }
    }

    return nextNodes;
  }

  /**
   * Fade out current audio
   * @param {Object} nodes - Source and gain nodes
   * @param {number} duration - Fade duration in seconds (optional)
   * @returns {Promise} Resolves when fade completes
   */
  async fadeOut(nodes, duration = null) {
    if (!nodes || !nodes.gain || !this.audioContext) {
      return;
    }

    const fadeDuration = duration || this.crossfadeDuration;
    const now = this.audioContext.currentTime;
    const endTime = now + fadeDuration;

    nodes.gain.gain.linearRampToValueAtTime(0, endTime);

    await new Promise(resolve => {
      setTimeout(resolve, fadeDuration * 1000);
    });

    nodes.gain.disconnect();
    if (nodes.source) {
      nodes.source.disconnect();
    }
  }

  /**
   * Fade in audio
   * @param {Object} nodes - Source and gain nodes
   * @param {number} duration - Fade duration in seconds (optional)
   * @returns {Promise} Resolves when fade completes
   */
  async fadeIn(nodes, duration = null) {
    if (!nodes || !nodes.gain || !this.audioContext) {
      return;
    }

    const fadeDuration = duration || this.crossfadeDuration;
    const now = this.audioContext.currentTime;
    const endTime = now + fadeDuration;

    // Start at 0
    nodes.gain.gain.value = 0;
    
    // Ramp to 1.0
    nodes.gain.gain.linearRampToValueAtTime(1.0, endTime);

    await new Promise(resolve => {
      setTimeout(resolve, fadeDuration * 1000);
    });
  }

  /**
   * Set volume for audio nodes
   * @param {Object} nodes - Source and gain nodes
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(nodes, volume) {
    if (nodes && nodes.gain) {
      nodes.gain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Clean up audio context
   */
  async cleanup() {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    this.currentSource = null;
    this.currentGain = null;
    this.nextSource = null;
    this.nextGain = null;
  }
}

export default AudioMixer;
