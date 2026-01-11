const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const PRESETS_FILE = path.join(__dirname, '../storage/presets.json');
const FAVORITES_FILE = path.join(__dirname, '../storage/favorites.json');

/**
 * Initialize preset storage
 */
async function initPresetStorage() {
  try {
    const storageDir = path.join(__dirname, '../storage');
    await fs.mkdir(storageDir, { recursive: true });
    
    // Initialize presets file if it doesn't exist
    try {
      await fs.access(PRESETS_FILE);
    } catch {
      await fs.writeFile(PRESETS_FILE, JSON.stringify([], null, 2));
    }
    
    // Initialize favorites file if it doesn't exist
    try {
      await fs.access(FAVORITES_FILE);
    } catch {
      await fs.writeFile(FAVORITES_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize preset storage:', error);
  }
}

/**
 * Create a new preset
 * @param {Object} presetData - Preset data
 * @returns {Promise<Object>} Created preset
 */
async function createPreset(presetData) {
  await initPresetStorage();
  
  const preset = {
    id: randomUUID(),
    name: presetData.name || 'Unnamed Preset',
    description: presetData.description || '',
    prompt: presetData.prompt || '',
    mood: presetData.mood || 'default',
    tags: presetData.tags || [],
    parameters: {
      duration: presetData.duration || 45,
      ...presetData.parameters
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesPlayed: 0
  };
  
  // Read existing presets
  const data = await fs.readFile(PRESETS_FILE, 'utf-8');
  const presets = JSON.parse(data);
  
  // Add new preset
  presets.push(preset);
  
  // Write back
  await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
  
  return preset;
}

/**
 * Get all presets
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of presets
 */
async function getAllPresets(filters = {}) {
  try {
    await initPresetStorage();
    const data = await fs.readFile(PRESETS_FILE, 'utf-8');
    let presets = JSON.parse(data);
    
    // Apply filters
    if (filters.mood) {
      presets = presets.filter(p => p.mood === filters.mood);
    }
    
    if (filters.tag) {
      presets = presets.filter(p => p.tags.includes(filters.tag));
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      presets = presets.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.prompt.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by most played or creation date
    if (filters.sortBy === 'popular') {
      presets.sort((a, b) => b.timesPlayed - a.timesPlayed);
    } else {
      presets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return presets;
  } catch (error) {
    return [];
  }
}

/**
 * Get preset by ID
 * @param {string} id - Preset ID
 * @returns {Promise<Object|null>} Preset or null
 */
async function getPresetById(id) {
  try {
    const data = await fs.readFile(PRESETS_FILE, 'utf-8');
    const presets = JSON.parse(data);
    return presets.find(p => p.id === id) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update preset
 * @param {string} id - Preset ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object|null>} Updated preset or null
 */
async function updatePreset(id, updates) {
  try {
    const data = await fs.readFile(PRESETS_FILE, 'utf-8');
    const presets = JSON.parse(data);
    
    const index = presets.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    // Merge updates
    presets[index] = {
      ...presets[index],
      ...updates,
      id: presets[index].id, // Preserve ID
      createdAt: presets[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
    
    return presets[index];
  } catch (error) {
    return null;
  }
}

/**
 * Delete preset
 * @param {string} id - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function deletePreset(id) {
  try {
    const data = await fs.readFile(PRESETS_FILE, 'utf-8');
    const presets = JSON.parse(data);
    
    const filtered = presets.filter(p => p.id !== id);
    
    if (filtered.length === presets.length) {
      return false; // Not found
    }
    
    await fs.writeFile(PRESETS_FILE, JSON.stringify(filtered, null, 2));
    
    // Also remove from favorites
    await removeFavorite(id);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Increment play count for preset
 * @param {string} id - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function incrementPlayCount(id) {
  try {
    const data = await fs.readFile(PRESETS_FILE, 'utf-8');
    const presets = JSON.parse(data);
    
    const preset = presets.find(p => p.id === id);
    if (!preset) return false;
    
    preset.timesPlayed = (preset.timesPlayed || 0) + 1;
    
    await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Add preset to favorites
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function addFavorite(presetId) {
  try {
    await initPresetStorage();
    
    // Verify preset exists
    const preset = await getPresetById(presetId);
    if (!preset) return false;
    
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    const favorites = JSON.parse(data);
    
    // Check if already favorited
    if (favorites.includes(presetId)) {
      return true; // Already favorited
    }
    
    favorites.push(presetId);
    
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove preset from favorites
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function removeFavorite(presetId) {
  try {
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    const favorites = JSON.parse(data);
    
    const filtered = favorites.filter(id => id !== presetId);
    
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(filtered, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all favorite presets
 * @returns {Promise<Array>} Array of favorite presets
 */
async function getFavorites() {
  try {
    await initPresetStorage();
    
    const favData = await fs.readFile(FAVORITES_FILE, 'utf-8');
    const favoriteIds = JSON.parse(favData);
    
    const presetData = await fs.readFile(PRESETS_FILE, 'utf-8');
    const allPresets = JSON.parse(presetData);
    
    // Get presets that are in favorites
    const favorites = allPresets.filter(p => favoriteIds.includes(p.id));
    
    return favorites;
  } catch (error) {
    return [];
  }
}

/**
 * Check if preset is favorited
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Is favorited
 */
async function isFavorite(presetId) {
  try {
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    const favorites = JSON.parse(data);
    return favorites.includes(presetId);
  } catch (error) {
    return false;
  }
}

module.exports = {
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
};
