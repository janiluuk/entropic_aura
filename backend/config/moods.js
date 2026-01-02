// Mood-based FFmpeg filter presets
const MOOD_PRESETS = {
  'Relaxing': [
    'acompressor=threshold=-20dB:ratio=2:attack=5:release=50',
    'lowpass=f=8000',
    'aecho=0.6:0.7:1500:0.4',
    'alimiter=limit=0.85'
  ],
  'Energizing': [
    'acompressor=threshold=-18dB:ratio=3:attack=2:release=30',
    'highpass=f=100',
    'treble=g=3',
    'aecho=0.4:0.5:500:0.2',
    'alimiter=limit=0.95'
  ],
  'default': [
    'acompressor=threshold=-20dB:ratio=2:attack=5:release=50',
    'highpass=f=120',
    'aecho=0.8:0.9:1000:0.3',
    'alimiter=limit=0.95'
  ]
};

function getMoodFilters(mood) {
  return MOOD_PRESETS[mood] || MOOD_PRESETS['default'];
}

function isValidMood(mood) {
  return mood === '' || Object.prototype.hasOwnProperty.call(MOOD_PRESETS, mood);
}

function listMoods() {
  return Object.keys(MOOD_PRESETS).filter(m => m !== 'default');
}

module.exports = {
  getMoodFilters,
  isValidMood,
  listMoods,
  MOOD_PRESETS
};
