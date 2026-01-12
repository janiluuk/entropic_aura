const fs = require('fs').promises;
const path = require('path');
const { createPreset, getAllPresets, initPresetStorage } = require('./presets');

const DEFAULT_PRESETS_FILE = path.join(__dirname, '../data/defaultPresets.json');

/**
 * Seed default presets if storage is empty
 * @returns {Promise<number>} Number of presets seeded
 */
async function seedDefaultPresets() {
  try {
    // Ensure storage is initialized
    await initPresetStorage();
    
    // Check if we already have presets
    const existingPresets = await getAllPresets();
    if (existingPresets.length > 0) {
      console.log('Presets already exist, skipping seeding');
      return 0;
    }

    // Load default presets
    const data = await fs.readFile(DEFAULT_PRESETS_FILE, 'utf-8');
    const defaultPresets = JSON.parse(data);

    // Create each preset
    let seededCount = 0;
    for (const presetData of defaultPresets) {
      try {
        await createPreset(presetData);
        seededCount++;
      } catch (error) {
        console.error(`Failed to seed preset ${presetData.name}:`, error);
      }
    }

    console.log(`Successfully seeded ${seededCount} default presets`);
    return seededCount;
  } catch (error) {
    console.error('Failed to seed default presets:', error);
    return 0;
  }
}

/**
 * Force seed default presets (replaces existing)
 * WARNING: This will clear all existing presets
 * @returns {Promise<number>} Number of presets seeded
 */
async function forceSeedDefaultPresets() {
  try {
    // Ensure storage is initialized
    await initPresetStorage();
    
    // Load default presets
    const data = await fs.readFile(DEFAULT_PRESETS_FILE, 'utf-8');
    const defaultPresets = JSON.parse(data);

    // Create each preset
    let seededCount = 0;
    for (const presetData of defaultPresets) {
      try {
        await createPreset(presetData);
        seededCount++;
      } catch (error) {
        console.error(`Failed to seed preset ${presetData.name}:`, error);
      }
    }

    console.log(`Force seeded ${seededCount} default presets`);
    return seededCount;
  } catch (error) {
    console.error('Failed to force seed default presets:', error);
    return 0;
  }
}

module.exports = {
  seedDefaultPresets,
  forceSeedDefaultPresets
};
