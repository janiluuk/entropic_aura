const express = require('express');
const { generateAndStream, checkComfyHealth } = require('./comfyAudioClient');
const { listMoods } = require('./config/moods');
const { initStorage, saveSoundscape, getRecentSoundscapes } = require('./utils/storage');

// Initialize storage on module load
initStorage().catch(console.error);

function createApp(generateFn = generateAndStream, host = process.env.COMFY_HOST || '127.0.0.1:8188') {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const health = await checkComfyHealth(host);
    const status = health.healthy ? 200 : 503;
    res.status(status).json({
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

