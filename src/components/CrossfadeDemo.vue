<template>
  <div class="crossfade-demo">
    <h2>Audio Crossfade Demo</h2>
    <p>This demo shows the real-time audio mixing with crossfading capabilities.</p>
    
    <div class="controls">
      <div class="control-group">
        <label>Crossfade Duration (seconds)</label>
        <input 
          v-model.number="crossfadeDuration" 
          type="range" 
          min="0" 
          max="30" 
          step="1"
          @input="updateCrossfadeDuration"
        />
        <span>{{ crossfadeDuration }}s</span>
      </div>
      
      <div class="button-group">
        <button @click="playTrack1" :disabled="isPlaying && currentTrack === 1">
          Play Track 1
        </button>
        <button @click="playTrack2" :disabled="isPlaying && currentTrack === 2">
          Play Track 2
        </button>
        <button @click="crossfadeToNext" :disabled="!isPlaying || isCrossfading">
          {{ isCrossfading ? 'Crossfading...' : 'Crossfade to Next' }}
        </button>
        <button @click="stopAudio" :disabled="!isPlaying">
          Stop
        </button>
      </div>
    </div>
    
    <div class="status">
      <p>Status: {{ statusText }}</p>
      <p v-if="isCrossfading" class="crossfading">
        🎵 Crossfading in progress...
      </p>
    </div>
    
    <!-- Hidden audio elements for demo -->
    <audio ref="audio1" loop>
      <source :src="track1Url" />
    </audio>
    <audio ref="audio2" loop>
      <source :src="track2Url" />
    </audio>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAudioMixer } from '@/composables/useAudioMixer';

const audio1 = ref(null);
const audio2 = ref(null);
const currentTrack = ref(0);
const crossfadeDuration = ref(5);

// Demo track URLs - using API endpoints
const track1Url = ref('/api/stream?text=peaceful forest with birds&mood=Relaxing');
const track2Url = ref('/api/stream?text=ocean waves on beach&mood=Peaceful');

// Use the audio mixer composable
const {
  isPlaying,
  isCrossfading,
  play,
  crossfade,
  stop,
  setCrossfadeDuration,
  init
} = useAudioMixer();

// Initialize audio context on user interaction
const initialized = ref(false);

const statusText = computed(() => {
  if (!isPlaying.value) return 'Not playing';
  if (isCrossfading.value) return 'Crossfading...';
  return `Playing Track ${currentTrack.value}`;
});

const ensureInitialized = () => {
  if (!initialized.value) {
    init();
    initialized.value = true;
  }
};

const updateCrossfadeDuration = () => {
  setCrossfadeDuration(crossfadeDuration.value);
};

const playTrack1 = async () => {
  ensureInitialized();
  try {
    await play(audio1.value);
    currentTrack.value = 1;
  } catch (error) {
    console.error('Error playing track 1:', error);
  }
};

const playTrack2 = async () => {
  ensureInitialized();
  try {
    await play(audio2.value);
    currentTrack.value = 2;
  } catch (error) {
    console.error('Error playing track 2:', error);
  }
};

const crossfadeToNext = async () => {
  ensureInitialized();
  try {
    const nextAudio = currentTrack.value === 1 ? audio2.value : audio1.value;
    await crossfade(nextAudio);
    currentTrack.value = currentTrack.value === 1 ? 2 : 1;
  } catch (error) {
    console.error('Error crossfading:', error);
  }
};

const stopAudio = async () => {
  try {
    await stop();
    currentTrack.value = 0;
    if (audio1.value) audio1.value.pause();
    if (audio2.value) audio2.value.pause();
  } catch (error) {
    console.error('Error stopping audio:', error);
  }
};

// Set initial crossfade duration
setCrossfadeDuration(crossfadeDuration.value);
</script>

<style scoped>
.crossfade-demo {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

h2 {
  margin-bottom: 1rem;
  color: #fff;
}

p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.controls {
  margin-bottom: 2rem;
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #fff;
  font-weight: 500;
}

.control-group input[type="range"] {
  width: 100%;
  max-width: 400px;
  margin-right: 1rem;
}

.control-group span {
  color: #4CAF50;
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.status {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-top: 2rem;
}

.status p {
  margin: 0.5rem 0;
  color: #fff;
}

.crossfading {
  color: #4CAF50 !important;
  font-weight: bold;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

audio {
  display: none;
}
</style>
