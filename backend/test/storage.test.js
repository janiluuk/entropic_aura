const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const { 
  saveSoundscape, 
  getRecentSoundscapes, 
  getSoundscapeById,
  cleanupOldSoundscapes 
} = require('../utils/storage');

// Test metadata file path
const TEST_METADATA_FILE = path.join(__dirname, '../storage/metadata.json');

test('saveSoundscape creates new soundscape with ID', async () => {
  const metadata = {
    text: 'Test soundscape',
    mood: 'Relaxing'
  };
  
  const id = await saveSoundscape(metadata);
  
  assert.ok(id, 'Should return an ID');
  assert.ok(typeof id === 'string', 'ID should be a string');
  assert.ok(id.length > 0, 'ID should not be empty');
});

test('getRecentSoundscapes returns array', async () => {
  const soundscapes = await getRecentSoundscapes(5);
  
  assert.ok(Array.isArray(soundscapes), 'Should return an array');
  assert.ok(soundscapes.length >= 0, 'Should have 0 or more soundscapes');
});

test('getSoundscapeById returns soundscape when exists', async () => {
  // First create a soundscape
  const metadata = {
    text: 'Findable soundscape',
    mood: 'Energizing'
  };
  
  const id = await saveSoundscape(metadata);
  
  // Then try to find it
  const found = await getSoundscapeById(id);
  
  assert.ok(found, 'Should find the soundscape');
  assert.strictEqual(found.id, id, 'IDs should match');
  assert.strictEqual(found.text, metadata.text, 'Text should match');
  assert.strictEqual(found.mood, metadata.mood, 'Mood should match');
});

test('getSoundscapeById returns null when not exists', async () => {
  const found = await getSoundscapeById('non-existent-id');
  
  assert.strictEqual(found, null, 'Should return null for non-existent ID');
});

test('cleanupOldSoundscapes returns number of deleted items', async () => {
  const deleted = await cleanupOldSoundscapes(30);
  
  assert.ok(typeof deleted === 'number', 'Should return a number');
  assert.ok(deleted >= 0, 'Should be non-negative');
});
