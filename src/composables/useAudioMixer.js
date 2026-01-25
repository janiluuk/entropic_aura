import { ref, onUnmounted } from 'vue';
import { AudioMixer } from '@/utils/AudioMixer';

/**
 * Composable for using AudioMixer with crossfading capabilities
 * Provides reactive state and methods for managing audio playback with smooth transitions
 */
export function useAudioMixer() {
  const mixer = new AudioMixer();
  const isPlaying = ref(false);
  const currentNodes = ref(null);
  const isCrossfading = ref(false);
  const crossfadeDuration = ref(5);

  /**
   * Initialize audio context
   */
  const init = () => {
    return mixer.init();
  };

  /**
   * Set crossfade duration
   * @param {number} duration - Duration in seconds (0-30)
   */
  const setCrossfadeDuration = (duration) => {
    crossfadeDuration.value = duration;
    mixer.setCrossfadeDuration(duration);
  };

  /**
   * Play audio element
   * @param {HTMLAudioElement} audioElement - Audio element to play
   */
  const play = (audioElement) => {
    const nodes = mixer.playAudio(audioElement);
    currentNodes.value = nodes;
    isPlaying.value = true;
    return nodes;
  };

  /**
   * Crossfade to next audio
   * @param {HTMLAudioElement} nextAudioElement - Next audio element
   * @returns {Promise} Resolves when crossfade completes
   */
  const crossfade = async (nextAudioElement) => {
    isCrossfading.value = true;
    try {
      const nodes = await mixer.crossfade(nextAudioElement, currentNodes.value);
      currentNodes.value = nodes;
      isPlaying.value = true;
      return nodes;
    } finally {
      isCrossfading.value = false;
    }
  };

  /**
   * Fade out current audio
   * @param {number} duration - Optional fade duration
   */
  const fadeOut = async (duration = null) => {
    if (currentNodes.value) {
      await mixer.fadeOut(currentNodes.value, duration);
      isPlaying.value = false;
    }
  };

  /**
   * Fade in current audio
   * @param {number} duration - Optional fade duration
   */
  const fadeIn = async (duration = null) => {
    if (currentNodes.value) {
      await mixer.fadeIn(currentNodes.value, duration);
    }
  };

  /**
   * Set volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  const setVolume = (volume) => {
    if (currentNodes.value) {
      mixer.setVolume(currentNodes.value, volume);
    }
  };

  /**
   * Stop playback and cleanup
   */
  const stop = async () => {
    if (currentNodes.value) {
      await fadeOut(0.5); // Quick fade out
    }
    isPlaying.value = false;
  };

  /**
   * Cleanup on unmount
   */
  onUnmounted(async () => {
    await mixer.cleanup();
  });

  return {
    init,
    play,
    crossfade,
    fadeOut,
    fadeIn,
    setVolume,
    stop,
    setCrossfadeDuration,
    isPlaying,
    isCrossfading,
    crossfadeDuration,
    currentNodes
  };
}
