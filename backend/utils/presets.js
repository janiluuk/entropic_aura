const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const PRESETS_FILE = path.join(__dirname, '../storage/presets.json');
const FAVORITES_FILE = path.join(__dirname, '../storage/favorites.json');

// Retry configuration for handling race conditions in concurrent operations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 50;

/**
 * Safely read and parse JSON file with fallback
 * @param {string} filePath - Path to JSON file
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {Promise<*>} Parsed data or default value
 */
async function safeReadJSON(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    // Handle empty or whitespace-only files
    if (!data || data.trim().length === 0) {
      return defaultValue;
    }
    return JSON.parse(data);
  } catch (error) {
    // Return default value on any error (file not found, parse error, etc.)
    return defaultValue;
  }
}

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
  
  // Retry logic for race conditions in concurrent tests
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Read existing presets
      const presets = await safeReadJSON(PRESETS_FILE, []);
      
      // Add new preset
      presets.push(preset);
      
      // Write back
      await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
      
      // Verify write by reading back
      const verification = await safeReadJSON(PRESETS_FILE, []);
      if (verification.some(p => p.id === preset.id)) {
        return preset;
      }
      
      // If verification failed and not last attempt, retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
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
    let presets = await safeReadJSON(PRESETS_FILE, []);
    
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
  // Retry logic for race conditions in concurrent tests
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      const presets = await safeReadJSON(PRESETS_FILE, []);
      const preset = presets.find(p => p.id === id);
      
      if (preset || attempt === maxRetries - 1) {
        return preset || null;
      }
      
      // If not found and not the last attempt, retry after a delay
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
}

/**
 * Update preset
 * @param {string} id - Preset ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object|null>} Updated preset or null
 */
async function updatePreset(id, updates) {
  // Retry logic for race conditions in concurrent tests
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      const presets = await safeReadJSON(PRESETS_FILE, []);
      
      const index = presets.findIndex(p => p.id === id);
      if (index === -1) {
        // If not found and not the last attempt, retry after a delay
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return null;
      }
      
      // Merge updates
      presets[index] = {
        ...presets[index],
        ...updates,
        id: presets[index].id, // Preserve ID
        createdAt: presets[index].createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
      
      // Verify write by reading back
      const verification = await safeReadJSON(PRESETS_FILE, []);
      const verifiedPreset = verification.find(p => p.id === id);
      
      if (verifiedPreset && verifiedPreset.updatedAt === presets[index].updatedAt) {
        return presets[index];
      }
      
      // If verification failed and not last attempt, retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return presets[index]; // Return the preset even if verification failed on last attempt
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
}

/**
 * Delete preset
 * @param {string} id - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function deletePreset(id) {
  // Retry logic for race conditions in concurrent tests
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      const presets = await safeReadJSON(PRESETS_FILE, []);
      
      const filtered = presets.filter(p => p.id !== id);
      
      if (filtered.length === presets.length) {
        // Not found - retry if not last attempt
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      }
      
      await fs.writeFile(PRESETS_FILE, JSON.stringify(filtered, null, 2));
      
      // Also remove from favorites
      await removeFavorite(id);
      
      return true;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Increment play count for preset
 * @param {string} id - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function incrementPlayCount(id) {
  // Retry logic for race conditions in concurrent tests
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      const presets = await safeReadJSON(PRESETS_FILE, []);
      
      const preset = presets.find(p => p.id === id);
      if (!preset) {
        // Not found - retry if not last attempt
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      }
      
      preset.timesPlayed = (preset.timesPlayed || 0) + 1;
      
      await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
      
      // Verify write by reading back
      const verification = await safeReadJSON(PRESETS_FILE, []);
      const verifiedPreset = verification.find(p => p.id === id);
      
      if (verifiedPreset && verifiedPreset.timesPlayed === preset.timesPlayed) {
        return true;
      }
      
      // If verification failed and not last attempt, retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return true; // Return true even if verification failed on last attempt
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Add preset to favorites
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function addFavorite(presetId) {
  // Retry logic with write verification for race conditions
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      
      // Verify preset exists (getPresetById has its own retry logic)
      const preset = await getPresetById(presetId);
      if (!preset) {
        // Preset not found - retry if not last attempt
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      }
      
      const favorites = await safeReadJSON(FAVORITES_FILE, []);
      
      // Check if already favorited
      if (favorites.includes(presetId)) {
        return true; // Already favorited
      }
      
      favorites.push(presetId);
      
      await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
      
      // Verify write by reading back
      const verification = await safeReadJSON(FAVORITES_FILE, []);
      if (verification.includes(presetId)) {
        return true;
      }
      
      // Write didn't persist - retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return false;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Remove preset from favorites
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function removeFavorite(presetId) {
  // Retry logic with write verification for race conditions
  const maxRetries = MAX_RETRIES;
  const retryDelay = RETRY_DELAY_MS;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await initPresetStorage();
      const favorites = await safeReadJSON(FAVORITES_FILE, []);
      
      const filtered = favorites.filter(id => id !== presetId);
      
      await fs.writeFile(FAVORITES_FILE, JSON.stringify(filtered, null, 2));
      
      // Verify write by reading back
      const verification = await safeReadJSON(FAVORITES_FILE, []);
      if (!verification.includes(presetId)) {
        return true;
      }
      
      // Write didn't persist - retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return false;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Get all favorite presets
 * @returns {Promise<Array>} Array of favorite presets
 */
async function getFavorites() {
  try {
    await initPresetStorage();
    
    const favoriteIds = await safeReadJSON(FAVORITES_FILE, []);
    const allPresets = await safeReadJSON(PRESETS_FILE, []);
    
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
    await initPresetStorage();
    const favorites = await safeReadJSON(FAVORITES_FILE, []);
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
