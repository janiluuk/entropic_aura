const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const { createApp } = require('../server');

const TEST_PRESETS_FILE = path.join(__dirname, '../storage/presets.json');
const TEST_FAVORITES_FILE = path.join(__dirname, '../storage/favorites.json');

async function cleanupTestFiles() {
  try {
    await fs.unlink(TEST_PRESETS_FILE);
  } catch {}
  try {
    await fs.unlink(TEST_FAVORITES_FILE);
  } catch {}
}

// Helper to properly close server
function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

test('GET /api/tracks returns track pool status', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const response = await fetch(`http://localhost:${port}/api/tracks`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(body.status);
    assert.ok(Array.isArray(body.tracks));
    assert.ok(typeof body.status.maxTracks === 'number');


  } finally {
    await closeServer(server);
  }
});

test('POST /api/tracks creates a new track', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const response = await fetch(`http://localhost:${port}/api/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'peaceful forest',
        mood: 'Relaxing',
        volume: 0.8
      })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 201);
    assert.ok(body.track);
    assert.ok(body.track.id);
    assert.strictEqual(body.track.prompt, 'peaceful forest');
    assert.strictEqual(body.track.mood, 'Relaxing');
    assert.strictEqual(body.track.volume, 0.8);


  } finally {
    await closeServer(server);
  }
});

test('POST /api/tracks respects max tracks limit', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create 4 tracks (max limit)
    for (let i = 0; i < 4; i++) {
      await fetch(`http://localhost:${port}/api/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `track ${i}` })
      });
    }

    // Try to create a 5th track
    const response = await fetch(`http://localhost:${port}/api/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'track 5' })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 400);
    assert.ok(body.error.includes('Maximum tracks'));


  } finally {
    await closeServer(server);
  }
});

test('GET /api/tracks/:id returns specific track', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create a track
    const createRes = await fetch(`http://localhost:${port}/api/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test track' })
    });
    const { track } = await createRes.json();

    // Get the track
    const response = await fetch(`http://localhost:${port}/api/tracks/${track.id}`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(body.track);
    assert.strictEqual(body.track.id, track.id);


  } finally {
    await closeServer(server);
  }
});

test('PATCH /api/tracks/:id updates track', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create a track
    const createRes = await fetch(`http://localhost:${port}/api/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test track' })
    });
    const { track } = await createRes.json();

    // Update the track
    const response = await fetch(`http://localhost:${port}/api/tracks/${track.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'ready', volume: 0.5 })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.track.state, 'ready');
    assert.strictEqual(body.track.volume, 0.5);


  } finally {
    await closeServer(server);
  }
});

test('DELETE /api/tracks/:id removes track', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create a track
    const createRes = await fetch(`http://localhost:${port}/api/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test track' })
    });
    const { track } = await createRes.json();

    // Delete the track
    const response = await fetch(`http://localhost:${port}/api/tracks/${track.id}`, {
      method: 'DELETE'
    });

    assert.strictEqual(response.status, 204);

    // Verify it's gone
    const getRes = await fetch(`http://localhost:${port}/api/tracks/${track.id}`);
    assert.strictEqual(getRes.status, 404);


  } finally {
    await closeServer(server);
  }
});

test('GET /api/presets returns all presets', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const response = await fetch(`http://localhost:${port}/api/presets`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(body.presets));


  } finally {
    await closeServer(server);
  }
});

test('POST /api/presets creates a new preset', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const presetData = {
      name: 'Ocean Waves',
      description: 'Peaceful ocean sounds',
      prompt: 'gentle ocean waves',
      mood: 'Relaxing',
      tags: ['nature', 'ocean']
    };

    const response = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presetData)
    });
    const body = await response.json();

    assert.strictEqual(response.status, 201);
    assert.ok(body.preset);
    assert.ok(body.preset.id);
    assert.strictEqual(body.preset.name, 'Ocean Waves');
    assert.strictEqual(body.preset.mood, 'Relaxing');


  } finally {
    await closeServer(server);
  }
});

test('GET /api/presets/:id returns specific preset', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', prompt: 'test' })
    });
    const { preset } = await createRes.json();

    // Get preset
    const response = await fetch(`http://localhost:${port}/api/presets/${preset.id}`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.preset.id, preset.id);
    assert.ok(body.preset.isFavorite !== undefined);


  } finally {
    await closeServer(server);
  }
});

test('PATCH /api/presets/:id updates preset', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original', prompt: 'test' })
    });
    const { preset } = await createRes.json();

    // Update preset
    const response = await fetch(`http://localhost:${port}/api/presets/${preset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', description: 'New description' })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.preset.name, 'Updated');
    assert.strictEqual(body.preset.description, 'New description');


  } finally {
    await closeServer(server);
  }
});

test('DELETE /api/presets/:id removes preset', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', prompt: 'test' })
    });
    const { preset } = await createRes.json();

    // Delete preset
    const response = await fetch(`http://localhost:${port}/api/presets/${preset.id}`, {
      method: 'DELETE'
    });

    assert.strictEqual(response.status, 204);

    // Verify it's gone
    const getRes = await fetch(`http://localhost:${port}/api/presets/${preset.id}`);
    assert.strictEqual(getRes.status, 404);


  } finally {
    await closeServer(server);
  }
});

test('POST /api/presets/:id/play increments play count', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', prompt: 'test' })
    });
    const { preset } = await createRes.json();
    
    // Small delay to ensure preset is fully persisted (race condition mitigation)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Play preset
    const playRes = await fetch(`http://localhost:${port}/api/presets/${preset.id}/play`, {
      method: 'POST'
    });

    assert.strictEqual(playRes.status, 200);

    // Check play count
    const getRes = await fetch(`http://localhost:${port}/api/presets/${preset.id}`);
    const body = await getRes.json();
    assert.strictEqual(body.preset.timesPlayed, 1);
  } finally {
    await closeServer(server);
  }
});

test('POST /api/favorites/:presetId adds to favorites', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', prompt: 'test' })
    });
    const { preset } = await createRes.json();
    
    // Small delay to ensure preset is fully persisted (race condition mitigation)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add to favorites
    const response = await fetch(`http://localhost:${port}/api/favorites/${preset.id}`, {
      method: 'POST'
    });

    assert.strictEqual(response.status, 200);

    // Check favorites
    const favRes = await fetch(`http://localhost:${port}/api/favorites`);
    const favBody = await favRes.json();
    assert.strictEqual(favBody.favorites.length, 1);
    assert.strictEqual(favBody.favorites[0].id, preset.id);
  } finally {
    await closeServer(server);
  }
});

test('DELETE /api/favorites/:presetId removes from favorites', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create preset
    const createRes = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', prompt: 'test' })
    });
    const { preset } = await createRes.json();
    
    // Small delay to ensure preset is fully persisted (race condition mitigation)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add to favorites
    await fetch(`http://localhost:${port}/api/favorites/${preset.id}`, {
      method: 'POST'
    });
    
    // Small delay to ensure favorite is written
    await new Promise(resolve => setTimeout(resolve, 50));

    // Remove from favorites
    const response = await fetch(`http://localhost:${port}/api/favorites/${preset.id}`, {
      method: 'DELETE'
    });

    assert.strictEqual(response.status, 204);

    // Check favorites
    const favRes = await fetch(`http://localhost:${port}/api/favorites`);
    const favBody = await favRes.json();
    assert.strictEqual(favBody.favorites.length, 0);


  } finally {
    await closeServer(server);
  }
});

test('GET /api/favorites returns all favorite presets', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create presets
    const preset1Res = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Preset 1', prompt: 'test' })
    });
    const { preset: preset1 } = await preset1Res.json();

    const preset2Res = await fetch(`http://localhost:${port}/api/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Preset 2', prompt: 'test' })
    });
    const { preset: preset2 } = await preset2Res.json();
    
    // Small delay to ensure presets are fully persisted (race condition mitigation)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add to favorites
    await fetch(`http://localhost:${port}/api/favorites/${preset1.id}`, { method: 'POST' });
    await fetch(`http://localhost:${port}/api/favorites/${preset2.id}`, { method: 'POST' });
    
    // Small delay to ensure favorites are written
    await new Promise(resolve => setTimeout(resolve, 50));

    // Get favorites
    const response = await fetch(`http://localhost:${port}/api/favorites`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.favorites.length, 2);


  } finally {
    await closeServer(server);
  }
});

// Cleanup
test('cleanup test files', async () => {
  await cleanupTestFiles();
});
