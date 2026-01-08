const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const STORAGE_DIR = path.join(__dirname, '../storage/soundscapes');
const METADATA_FILE = path.join(__dirname, '../storage/metadata.json');

/**
 * Initialize storage directory
 */
async function initStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(path.join(__dirname, '../storage'), { recursive: true });
    
    // Initialize metadata file if it doesn't exist
    try {
      await fs.access(METADATA_FILE);
    } catch {
      await fs.writeFile(METADATA_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

/**
 * Save soundscape metadata
 * @param {Object} metadata - Soundscape metadata
 * @returns {Promise<string>} - Soundscape ID
 */
async function saveSoundscape(metadata) {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  
  const soundscape = {
    id,
    timestamp,
    ...metadata
  };
  
  // Read existing metadata
  const data = await fs.readFile(METADATA_FILE, 'utf-8');
  const soundscapes = JSON.parse(data);
  
  // Add new soundscape
  soundscapes.push(soundscape);
  
  // Keep only last 100 soundscapes
  const trimmed = soundscapes.slice(-100);
  
  // Write back
  await fs.writeFile(METADATA_FILE, JSON.stringify(trimmed, null, 2));
  
  return id;
}

/**
 * Get recent soundscapes
 * @param {number} limit - Maximum number to return
 * @returns {Promise<Array>} - Array of soundscape metadata
 */
async function getRecentSoundscapes(limit = 10) {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    const soundscapes = JSON.parse(data);
    return soundscapes.slice(-limit).reverse();
  } catch (error) {
    return [];
  }
}

/**
 * Get soundscape by ID
 * @param {string} id - Soundscape ID
 * @returns {Promise<Object|null>} - Soundscape metadata or null
 */
async function getSoundscapeById(id) {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    const soundscapes = JSON.parse(data);
    return soundscapes.find(s => s.id === id) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete old soundscapes
 * @param {number} daysOld - Delete soundscapes older than this many days
 * @returns {Promise<number>} - Number of deleted soundscapes
 */
async function cleanupOldSoundscapes(daysOld = 30) {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    const soundscapes = JSON.parse(data);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filtered = soundscapes.filter(s => {
      const date = new Date(s.timestamp);
      return date > cutoffDate;
    });
    
    const deleted = soundscapes.length - filtered.length;
    
    await fs.writeFile(METADATA_FILE, JSON.stringify(filtered, null, 2));
    
    return deleted;
  } catch (error) {
    return 0;
  }
}

module.exports = {
  initStorage,
  saveSoundscape,
  getRecentSoundscapes,
  getSoundscapeById,
  cleanupOldSoundscapes
};
