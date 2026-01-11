const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const {
  initPresetStorage,
  createPreset,
  getAllPresets,
  getPresetById,
  updatePreset,
  deletePreset,
  incrementPlayCount,
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite
} = require('../utils/presets');

const TEST_PRESETS_FILE = path.join(__dirname, '../storage/presets.json');
const TEST_FAVORITES_FILE = path.join(__dirname, '../storage/favorites.json');

// Helper to clean up test files
async function cleanupTestFiles() {
  try {
    await fs.unlink(TEST_PRESETS_FILE);
  } catch {}
  try {
    await fs.unlink(TEST_FAVORITES_FILE);
  } catch {}
}

test('initPresetStorage creates storage files', async () => {
  await cleanupTestFiles();
  await initPresetStorage();
  
  const presetsExist = await fs.access(TEST_PRESETS_FILE).then(() => true).catch(() => false);
  const favoritesExist = await fs.access(TEST_FAVORITES_FILE).then(() => true).catch(() => false);
  
  assert.ok(presetsExist);
  assert.ok(favoritesExist);
});

test('createPreset creates a new preset', async () => {
  await cleanupTestFiles();
  
  const presetData = {
    name: 'Test Preset',
    description: 'A test preset',
    prompt: 'peaceful forest sounds',
    mood: 'Relaxing',
    tags: ['nature', 'forest']
  };
  
  const preset = await createPreset(presetData);
  
  assert.ok(preset.id);
  assert.strictEqual(preset.name, 'Test Preset');
  assert.strictEqual(preset.mood, 'Relaxing');
  assert.deepStrictEqual(preset.tags, ['nature', 'forest']);
  assert.ok(preset.createdAt);
  assert.strictEqual(preset.timesPlayed, 0);
});

test('getAllPresets returns all presets', async () => {
  await cleanupTestFiles();
  
  await createPreset({ name: 'Preset 1', prompt: 'test 1' });
  await createPreset({ name: 'Preset 2', prompt: 'test 2' });
  
  const presets = await getAllPresets();
  
  assert.strictEqual(presets.length, 2);
});

test('getAllPresets filters by mood', async () => {
  await cleanupTestFiles();
  
  await createPreset({ name: 'Relaxing', mood: 'Relaxing', prompt: 'test' });
  await createPreset({ name: 'Energizing', mood: 'Energizing', prompt: 'test' });
  
  const relaxing = await getAllPresets({ mood: 'Relaxing' });
  
  assert.strictEqual(relaxing.length, 1);
  assert.strictEqual(relaxing[0].mood, 'Relaxing');
});

test('getAllPresets filters by tag', async () => {
  await cleanupTestFiles();
  
  await createPreset({ name: 'Nature', tags: ['nature', 'forest'], prompt: 'test' });
  await createPreset({ name: 'Urban', tags: ['urban', 'city'], prompt: 'test' });
  
  const nature = await getAllPresets({ tag: 'nature' });
  
  assert.strictEqual(nature.length, 1);
  assert.ok(nature[0].tags.includes('nature'));
});

test('getAllPresets filters by search query', async () => {
  await cleanupTestFiles();
  
  await createPreset({ name: 'Ocean Waves', description: 'Peaceful ocean', prompt: 'test' });
  await createPreset({ name: 'City Traffic', description: 'Busy street', prompt: 'test' });
  
  const ocean = await getAllPresets({ search: 'ocean' });
  
  assert.strictEqual(ocean.length, 1);
  assert.ok(ocean[0].name.includes('Ocean'));
});

test('getAllPresets sorts by popularity', async () => {
  await cleanupTestFiles();
  
  const preset1 = await createPreset({ name: 'Preset 1', prompt: 'test' });
  const preset2 = await createPreset({ name: 'Preset 2', prompt: 'test' });
  
  await incrementPlayCount(preset2.id);
  await incrementPlayCount(preset2.id);
  
  const presets = await getAllPresets({ sortBy: 'popular' });
  
  assert.strictEqual(presets[0].name, 'Preset 2');
  assert.strictEqual(presets[1].name, 'Preset 1');
});

test('getPresetById returns specific preset', async () => {
  await cleanupTestFiles();
  
  const created = await createPreset({ name: 'Test', prompt: 'test' });
  const retrieved = await getPresetById(created.id);
  
  assert.ok(retrieved);
  assert.strictEqual(retrieved.id, created.id);
  assert.strictEqual(retrieved.name, 'Test');
});

test('getPresetById returns null for non-existent preset', async () => {
  await cleanupTestFiles();
  
  const preset = await getPresetById('non-existent-id');
  
  assert.strictEqual(preset, null);
});

test('updatePreset updates preset fields', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Original', prompt: 'test' });
  const updated = await updatePreset(preset.id, {
    name: 'Updated',
    description: 'New description'
  });
  
  assert.ok(updated);
  assert.strictEqual(updated.name, 'Updated');
  assert.strictEqual(updated.description, 'New description');
  assert.strictEqual(updated.id, preset.id);
  assert.notStrictEqual(updated.updatedAt, updated.createdAt);
});

test('updatePreset preserves id and createdAt', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  const updated = await updatePreset(preset.id, {
    id: 'different-id',
    createdAt: '2000-01-01'
  });
  
  assert.strictEqual(updated.id, preset.id);
  assert.strictEqual(updated.createdAt, preset.createdAt);
});

test('deletePreset removes preset', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  const success = await deletePreset(preset.id);
  
  assert.ok(success);
  
  const retrieved = await getPresetById(preset.id);
  assert.strictEqual(retrieved, null);
});

test('deletePreset returns false for non-existent preset', async () => {
  await cleanupTestFiles();
  
  const success = await deletePreset('non-existent-id');
  
  assert.strictEqual(success, false);
});

test('incrementPlayCount increases play count', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  
  await incrementPlayCount(preset.id);
  await incrementPlayCount(preset.id);
  
  const updated = await getPresetById(preset.id);
  assert.strictEqual(updated.timesPlayed, 2);
});

test('addFavorite adds preset to favorites', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  const success = await addFavorite(preset.id);
  
  assert.ok(success);
  
  const isFav = await isFavorite(preset.id);
  assert.ok(isFav);
});

test('addFavorite handles duplicate favorites', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  
  await addFavorite(preset.id);
  await addFavorite(preset.id);
  
  const favorites = await getFavorites();
  assert.strictEqual(favorites.length, 1);
});

test('addFavorite returns false for non-existent preset', async () => {
  await cleanupTestFiles();
  
  const success = await addFavorite('non-existent-id');
  
  assert.strictEqual(success, false);
});

test('removeFavorite removes preset from favorites', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  
  await addFavorite(preset.id);
  await removeFavorite(preset.id);
  
  const isFav = await isFavorite(preset.id);
  assert.strictEqual(isFav, false);
});

test('getFavorites returns all favorite presets', async () => {
  await cleanupTestFiles();
  
  const preset1 = await createPreset({ name: 'Preset 1', prompt: 'test' });
  const preset2 = await createPreset({ name: 'Preset 2', prompt: 'test' });
  const preset3 = await createPreset({ name: 'Preset 3', prompt: 'test' });
  
  await addFavorite(preset1.id);
  await addFavorite(preset3.id);
  
  const favorites = await getFavorites();
  
  assert.strictEqual(favorites.length, 2);
  assert.ok(favorites.find(p => p.id === preset1.id));
  assert.ok(favorites.find(p => p.id === preset3.id));
});

test('deletePreset removes from favorites', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  
  await addFavorite(preset.id);
  await deletePreset(preset.id);
  
  const favorites = await getFavorites();
  assert.strictEqual(favorites.length, 0);
});

test('isFavorite returns false for non-favorited preset', async () => {
  await cleanupTestFiles();
  
  const preset = await createPreset({ name: 'Test', prompt: 'test' });
  const isFav = await isFavorite(preset.id);
  
  assert.strictEqual(isFav, false);
});

// Cleanup after all tests
test('cleanup test files', async () => {
  await cleanupTestFiles();
});
