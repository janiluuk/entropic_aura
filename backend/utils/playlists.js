const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const PLAYLISTS_FILE = path.join(__dirname, '../storage/playlists.json');

/**
 * Initialize playlist storage
 */
async function initPlaylistStorage() {
  try {
    const storageDir = path.join(__dirname, '../storage');
    await fs.mkdir(storageDir, { recursive: true });
    
    // Initialize playlists file if it doesn't exist
    try {
      await fs.access(PLAYLISTS_FILE);
    } catch {
      await fs.writeFile(PLAYLISTS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize playlist storage:', error);
  }
}

/**
 * Create a new playlist
 * @param {Object} playlistData - Playlist data
 * @returns {Promise<Object>} Created playlist
 */
async function createPlaylist(playlistData) {
  await initPlaylistStorage();
  
  const playlist = {
    id: randomUUID(),
    name: playlistData.name || 'Unnamed Playlist',
    description: playlistData.description || '',
    presets: playlistData.presets || [],
    rotationInterval: playlistData.rotationInterval || 300, // 5 minutes default
    shuffle: playlistData.shuffle || false,
    repeat: playlistData.repeat || true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Read existing playlists
  const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
  const playlists = JSON.parse(data);
  
  // Add new playlist
  playlists.push(playlist);
  
  // Write back
  await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
  
  return playlist;
}

/**
 * Get all playlists
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of playlists
 */
async function getAllPlaylists(filters = {}) {
  try {
    await initPlaylistStorage();
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    let playlists = JSON.parse(data);
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      playlists = playlists.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date (newest first)
    playlists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return playlists;
  } catch (error) {
    return [];
  }
}

/**
 * Get playlist by ID
 * @param {string} id - Playlist ID
 * @returns {Promise<Object|null>} Playlist or null
 */
async function getPlaylistById(id) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    return playlists.find(p => p.id === id) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update playlist
 * @param {string} id - Playlist ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object|null>} Updated playlist or null
 */
async function updatePlaylist(id, updates) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    
    const index = playlists.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    // Merge updates
    playlists[index] = {
      ...playlists[index],
      ...updates,
      id: playlists[index].id, // Preserve ID
      createdAt: playlists[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    
    return playlists[index];
  } catch (error) {
    return null;
  }
}

/**
 * Delete playlist
 * @param {string} id - Playlist ID
 * @returns {Promise<boolean>} Success
 */
async function deletePlaylist(id) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    
    const filtered = playlists.filter(p => p.id !== id);
    
    if (filtered.length === playlists.length) {
      return false; // Not found
    }
    
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(filtered, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Add preset to playlist
 * @param {string} playlistId - Playlist ID
 * @param {string} presetId - Preset ID
 * @param {Object} options - Optional preset options (duration, order)
 * @returns {Promise<boolean>} Success
 */
async function addPresetToPlaylist(playlistId, presetId, options = {}) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    
    // Check if preset already exists
    if (playlist.presets.some(p => p.presetId === presetId)) {
      return false; // Already exists
    }
    
    const presetEntry = {
      presetId,
      duration: options.duration || null, // null means use preset default
      order: options.order !== undefined ? options.order : playlist.presets.length
    };
    
    playlist.presets.push(presetEntry);
    playlist.updatedAt = new Date().toISOString();
    
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove preset from playlist
 * @param {string} playlistId - Playlist ID
 * @param {string} presetId - Preset ID
 * @returns {Promise<boolean>} Success
 */
async function removePresetFromPlaylist(playlistId, presetId) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    
    const originalLength = playlist.presets.length;
    playlist.presets = playlist.presets.filter(p => p.presetId !== presetId);
    
    if (playlist.presets.length === originalLength) {
      return false; // Not found
    }
    
    playlist.updatedAt = new Date().toISOString();
    
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Reorder presets in playlist
 * @param {string} playlistId - Playlist ID
 * @param {Array} presetIds - Array of preset IDs in desired order
 * @returns {Promise<boolean>} Success
 */
async function reorderPlaylistPresets(playlistId, presetIds) {
  try {
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf-8');
    const playlists = JSON.parse(data);
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    
    // Validate that all presetIds exist in the playlist and lengths match
    const existingIds = new Set(playlist.presets.map(p => p.presetId));
    if (presetIds.length !== playlist.presets.length || 
        !presetIds.every(id => existingIds.has(id))) {
      return false; // Invalid preset IDs or incomplete list
    }
    
    // Reorder presets
    const reordered = presetIds.map((presetId, index) => {
      const preset = playlist.presets.find(p => p.presetId === presetId);
      return {
        ...preset,
        order: index
      };
    });
    
    playlist.presets = reordered;
    playlist.updatedAt = new Date().toISOString();
    
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  initPlaylistStorage,
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addPresetToPlaylist,
  removePresetFromPlaylist,
  reorderPlaylistPresets
};
