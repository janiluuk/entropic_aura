const express = require('express');
const { generateAndStream } = require('./comfyAudioClient');

function createApp(generateFn = generateAndStream) {
  const app = express();

  app.get('/api/stream', async (req, res) => {
    const { text = '' } = req.query;
    res.setHeader('Content-Type', 'audio/aac');
    try {
      await generateFn(text, res);
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

