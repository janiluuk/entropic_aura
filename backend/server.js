const express = require('express');
const { generateAndStream, checkComfyHealth } = require('./comfyAudioClient');
const { listMoods } = require('./config/moods');
const { initStorage, saveSoundscape, getRecentSoundscapes } = require('./utils/storage');
const { TrackManager } = require('./trackManager');
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
} = require('./utils/presets');

// Initialize storage on module load
initStorage().catch(console.error);
initPresetStorage().catch(console.error);

function createApp(options = {}) {
  const { generateFn = generateAndStream, host = process.env.COMFY_HOST || '127.0.0.1:8188' } = options;
  const app = express();
  
  // Create a track manager instance for this app
  const trackManager = new TrackManager(4);
  
  // Parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const health = await checkComfyHealth(host);
    // Always return 200 - backend is healthy even if ComfyUI is unavailable
    res.status(200).json({
      backend: 'ok',
      comfyui: health.healthy ? 'ok' : 'unavailable',
      error: health.error || null,
      timestamp: new Date().toISOString()
    });
  });

  // Get available moods
  app.get('/api/moods', (req, res) => {
    res.json({ moods: listMoods() });
  });

  // Get recent soundscapes history
  app.get('/api/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const soundscapes = await getRecentSoundscapes(limit);
      res.json({ soundscapes });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Track Management Endpoints
  
  // Get track pool status
  app.get('/api/tracks', (req, res) => {
    try {
      const status = trackManager.getStatus();
      const tracks = trackManager.getAllTracks();
      res.json({ status, tracks });
    } catch (error) {
      console.error('Error fetching tracks:', error);
      res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  });
  
  // Create a new track
  app.post('/api/tracks', (req, res) => {
    try {
      const { prompt, mood, volume, duration, metadata } = req.body;
      
      if (!trackManager.canAddTrack()) {
        return res.status(400).json({ error: 'Maximum tracks reached' });
      }
      
      const track = trackManager.createTrack({
        prompt,
        mood,
        volume,
        duration,
        metadata
      });
      
      res.status(201).json({ track });
    } catch (error) {
      console.error('Error creating track:', error);
      res.status(500).json({ error: 'Failed to create track' });
    }
  });
  
  // Get specific track
  app.get('/api/tracks/:id', (req, res) => {
    const track = trackManager.getTrack(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ track });
  });
  
  // Update track
  app.patch('/api/tracks/:id', (req, res) => {
    try {
      const { state, volume } = req.body;
      const track = trackManager.getTrack(req.params.id);
      
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      if (state) {
        trackManager.updateTrackState(req.params.id, state);
      }
      
      if (volume !== undefined) {
        trackManager.updateTrackVolume(req.params.id, volume);
      }
      
      const updatedTrack = trackManager.getTrack(req.params.id);
      res.json({ track: updatedTrack });
    } catch (error) {
      console.error('Error updating track:', error);
      res.status(500).json({ error: 'Failed to update track' });
    }
  });
  
  // Delete track
  app.delete('/api/tracks/:id', (req, res) => {
    const success = trackManager.removeTrack(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.status(204).send();
  });

  // Preset Management Endpoints
  
  // Get all presets
  app.get('/api/presets', async (req, res) => {
    try {
      const { mood, tag, search, sortBy } = req.query;
      const presets = await getAllPresets({ mood, tag, search, sortBy });
      
      // Add favorite status to each preset
      const presetsWithFavorites = await Promise.all(
        presets.map(async (preset) => ({
          ...preset,
          isFavorite: await isFavorite(preset.id)
        }))
      );
      
      res.json({ presets: presetsWithFavorites });
    } catch (error) {
      console.error('Error fetching presets:', error);
      res.status(500).json({ error: 'Failed to fetch presets' });
    }
  });
  
  // Create a new preset
  app.post('/api/presets', async (req, res) => {
    try {
      const preset = await createPreset(req.body);
      res.status(201).json({ preset });
    } catch (error) {
      console.error('Error creating preset:', error);
      res.status(500).json({ error: 'Failed to create preset' });
    }
  });
  
  // Get specific preset
  app.get('/api/presets/:id', async (req, res) => {
    try {
      const preset = await getPresetById(req.params.id);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      
      const favorite = await isFavorite(preset.id);
      res.json({ preset: { ...preset, isFavorite: favorite } });
    } catch (error) {
      console.error('Error fetching preset:', error);
      res.status(500).json({ error: 'Failed to fetch preset' });
    }
  });
  
  // Update preset
  app.patch('/api/presets/:id', async (req, res) => {
    try {
      const preset = await updatePreset(req.params.id, req.body);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json({ preset });
    } catch (error) {
      console.error('Error updating preset:', error);
      res.status(500).json({ error: 'Failed to update preset' });
    }
  });
  
  // Delete preset
  app.delete('/api/presets/:id', async (req, res) => {
    try {
      const success = await deletePreset(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting preset:', error);
      res.status(500).json({ error: 'Failed to delete preset' });
    }
  });
  
  // Increment preset play count
  app.post('/api/presets/:id/play', async (req, res) => {
    try {
      const success = await incrementPlayCount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error incrementing play count:', error);
      res.status(500).json({ error: 'Failed to increment play count' });
    }
  });
  
  // Favorites Endpoints
  
  // Get all favorites
  app.get('/api/favorites', async (req, res) => {
    try {
      const favorites = await getFavorites();
      res.json({ favorites });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });
  
  // Add to favorites
  app.post('/api/favorites/:presetId', async (req, res) => {
    try {
      const success = await addFavorite(req.params.presetId);
      if (!success) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  });
  
  // Remove from favorites
  app.delete('/api/favorites/:presetId', async (req, res) => {
    try {
      await removeFavorite(req.params.presetId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Failed to remove favorite' });
    }
  });

  app.get('/api/stream', async (req, res) => {
    const { text = '', mood = '' } = req.query;
    
    // Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
    
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text parameter must be 500 characters or less' });
    }
    
    // Save metadata (async, don't wait)
    saveSoundscape({
      text: text.trim(),
      mood: mood || 'default',
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('Failed to save metadata:', err));
    
    res.setHeader('Content-Type', 'audio/aac');
    try {
      await generateFn(text, res, host, mood);
    } catch (err) {
      console.error('Error generating audio:', err);
      if (!res.headersSent) {
        const errorMessage = err.message || 'Error generating audio';
        res.status(500).json({ error: errorMessage });
      } else {
        res.end();
      }
    }
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

module.exports = { createApp };

