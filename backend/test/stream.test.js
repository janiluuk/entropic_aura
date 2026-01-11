const test = require('node:test');
const assert = require('node:assert');
const { promisify } = require('util');
const { createApp } = require('../server');

test('GET /api/stream returns stubbed audio', async () => {
  const app = createApp({
    generateFn: async (text, res) => {
      res.end('ok');
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/stream?text=test`);
  const body = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body, 'ok');

  await promisify(server.close.bind(server))();
});

