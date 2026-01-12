const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const { seedDefaultPresets, forceSeedDefaultPresets } = require('../utils/seed');
const { getAllPresets } = require('../utils/presets');

const TEST_PRESETS_FILE = path.join(__dirname, '../storage/presets.json');

// Helper to clean up test files
async function cleanupTestFiles() {
  try {
    await fs.unlink(TEST_PRESETS_FILE);
  } catch {}
}

test('seedDefaultPresets loads default presets when storage is empty', async () => {
  await cleanupTestFiles();
  
  const count = await seedDefaultPresets();
  
  assert.ok(count > 0, 'Should seed at least one preset');
  
  const presets = await getAllPresets();
  assert.ok(presets.length > 0, 'Should have presets after seeding');
  assert.ok(presets.some(p => p.name === 'Ocean Waves'), 'Should include Ocean Waves preset');
});

test('seedDefaultPresets skips when presets already exist', async () => {
  await cleanupTestFiles();
  
  // First seed
  const firstCount = await seedDefaultPresets();
  assert.ok(firstCount > 0, 'First seed should add presets');
  
  // Second seed should skip
  const secondCount = await seedDefaultPresets();
  assert.strictEqual(secondCount, 0, 'Second seed should skip');
  
  const presets = await getAllPresets();
  assert.strictEqual(presets.length, firstCount, 'Should not duplicate presets');
});

test('seedDefaultPresets creates presets with correct structure', async () => {
  await cleanupTestFiles();
  
  await seedDefaultPresets();
  
  const presets = await getAllPresets();
  const oceanWaves = presets.find(p => p.name === 'Ocean Waves');
  
  assert.ok(oceanWaves, 'Ocean Waves preset should exist');
  assert.ok(oceanWaves.id, 'Should have an ID');
  assert.strictEqual(oceanWaves.name, 'Ocean Waves');
  assert.ok(oceanWaves.description, 'Should have a description');
  assert.ok(oceanWaves.prompt, 'Should have a prompt');
  assert.strictEqual(oceanWaves.mood, 'Relaxing');
  assert.ok(Array.isArray(oceanWaves.tags), 'Should have tags array');
  assert.ok(oceanWaves.tags.includes('nature'), 'Should have nature tag');
  assert.ok(oceanWaves.createdAt, 'Should have createdAt timestamp');
  assert.strictEqual(oceanWaves.timesPlayed, 0, 'Should have zero play count');
});

test('seedDefaultPresets seeds multiple presets with different moods', async () => {
  await cleanupTestFiles();
  
  await seedDefaultPresets();
  
  const presets = await getAllPresets();
  
  const moods = [...new Set(presets.map(p => p.mood))];
  assert.ok(moods.length > 1, 'Should have multiple different moods');
  assert.ok(moods.includes('Relaxing'), 'Should have Relaxing mood');
  assert.ok(moods.includes('Energizing') || moods.includes('Nature'), 'Should have other moods');
});

test('forceSeedDefaultPresets adds presets even when presets exist', async () => {
  await cleanupTestFiles();
  
  // First seed
  await seedDefaultPresets();
  const firstPresets = await getAllPresets();
  const firstCount = firstPresets.length;
  
  // Force seed should add more (duplicates)
  const forceCount = await forceSeedDefaultPresets();
  
  assert.ok(forceCount > 0, 'Force seed should add presets');
  
  const secondPresets = await getAllPresets();
  assert.ok(secondPresets.length > firstCount, 'Should have more presets after force seed');
});

test('default presets include expected categories', async () => {
  await cleanupTestFiles();
  
  await seedDefaultPresets();
  
  const presets = await getAllPresets();
  const names = presets.map(p => p.name);
  
  // Check for variety of categories
  assert.ok(names.some(n => n.includes('Ocean') || n.includes('Beach')), 'Should have water/beach presets');
  assert.ok(names.some(n => n.includes('Forest') || n.includes('Nature')), 'Should have nature presets');
  assert.ok(names.some(n => n.includes('City') || n.includes('Café')), 'Should have urban presets');
});

// Cleanup after all tests
test('cleanup test files', async () => {
  await cleanupTestFiles();
});
