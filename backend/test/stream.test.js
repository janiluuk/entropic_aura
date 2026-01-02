const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');

test('GET /api/stream returns stubbed audio', async () => {
  const app = createApp(async (text, res) => {
    res.end('ok');
  });

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/stream?text=test`);
  const body = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body, 'ok');

  server.close();
});

test('GET /api/stream validates text length', async () => {
  const app = createApp(async (text, res) => {
    res.end('ok');
  });

  const server = app.listen(0);
  const { port } = server.address();

  const longText = 'a'.repeat(501);
  const response = await fetch(`http://localhost:${port}/api/stream?text=${longText}`);
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error, 'Text too long (max 500 characters)');

  server.close();
});

test('GET /api/stream validates mood parameter', async () => {
  const app = createApp(async (text, res) => {
    res.end('ok');
  });

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/stream?text=test&mood=InvalidMood`);
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error, 'Invalid mood');
  assert.ok(Array.isArray(body.validMoods));

  server.close();
});

test('GET /api/stream accepts valid mood parameter', async () => {
  const app = createApp(async (text, res, host, mood) => {
    assert.strictEqual(mood, 'Relaxing');
    res.end('ok');
  });

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/stream?text=test&mood=Relaxing`);
  const body = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body, 'ok');

  server.close();
});

test('GET /api/health returns health status', async () => {
  const app = createApp();

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/health`);
  const body = await response.json();

  assert.ok(body.backend === 'ok');
  assert.ok(['ok', 'unavailable'].includes(body.comfyui));
  assert.ok(body.timestamp);

  server.close();
});

test('GET /api/moods returns list of moods', async () => {
  const app = createApp();

  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/moods`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(body.moods));
  assert.ok(body.moods.includes('Relaxing'));
  assert.ok(body.moods.includes('Energizing'));

  server.close();
});

