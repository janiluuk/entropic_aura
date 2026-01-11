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
  'Peaceful': [
    'acompressor=threshold=-22dB:ratio=1.5:attack=10:release=100',
    'lowpass=f=6000',
    'aecho=0.7:0.8:2000:0.5',
    'alimiter=limit=0.80'
  ],
  'Dark': [
    'acompressor=threshold=-16dB:ratio=4:attack=1:release=20',
    'lowpass=f=5000',
    'bass=g=5',
    'aecho=0.9:0.95:1200:0.6',
    'alimiter=limit=0.90'
  ],
  'Cinematic': [
    'acompressor=threshold=-18dB:ratio=2.5:attack=3:release=40',
    'highpass=f=80',
    'bass=g=2',
    'aecho=0.5:0.6:800:0.3',
    'alimiter=limit=0.92'
  ],
  'Nature': [
    'acompressor=threshold=-20dB:ratio=2:attack=8:release=60',
    'highpass=f=200',
    'aecho=0.8:0.85:1800:0.4',
    'alimiter=limit=0.88'
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
