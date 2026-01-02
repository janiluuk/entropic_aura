const express = require('express');
const { generateAndStream, checkComfyHealth } = require('./comfyAudioClient');
const { isValidMood, listMoods } = require('./config/moods');

function createApp(generateFn = generateAndStream, host = process.env.COMFY_HOST || '127.0.0.1:8188') {
  const app = express();

  app.get('/api/stream', async (req, res) => {
    const { text = '', mood = '' } = req.query;
    
    // Validation
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text too long (max 500 characters)' });
    }
    
    if (mood && !isValidMood(mood)) {
      return res.status(400).json({ 
        error: 'Invalid mood',
        validMoods: listMoods()
      });
    }
    
    res.setHeader('Content-Type', 'audio/aac');
    try {
      await generateFn(text, res, host, mood);
    } catch (err) {
      console.error('Error generating audio:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error generating audio',
          message: err.message 
        });
      }
    }
  });

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

  app.get('/api/moods', (req, res) => {
    res.json({ moods: listMoods() });
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

