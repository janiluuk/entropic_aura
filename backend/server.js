const express = require('express');
const { generateAndStream } = require('./comfyAudioClient');

function createApp(options = {}) {
  const { generateFn = generateAndStream, host = process.env.COMFY_HOST || '127.0.0.1:8188' } = options;
  const app = express();

  app.get('/api/stream', async (req, res) => {
    const { text = '' } = req.query;
    res.setHeader('Content-Type', 'audio/aac');
    try {
      await generateFn(text, res, host);
    } catch (err) {
      console.error(err);
      res.status(500).end('Error generating audio');
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

