const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const { createApp } = require('../server');

const TEST_PLAYLISTS_FILE = path.join(__dirname, '../storage/playlists.json');

async function cleanupTestFiles() {
  try {
    await fs.unlink(TEST_PLAYLISTS_FILE);
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

test('GET /api/playlists returns all playlists', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const response = await fetch(`http://localhost:${port}/api/playlists`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(body.playlists));


  } finally {
    await closeServer(server);
  }
});

test('POST /api/playlists creates a new playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const playlistData = {
      name: 'Morning Mix',
      description: 'Energizing morning sounds',
      rotationInterval: 300,
      shuffle: false,
      repeat: true
    };

    const response = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData)
    });
    const body = await response.json();

    assert.strictEqual(response.status, 201);
    assert.ok(body.playlist);
    assert.ok(body.playlist.id);
    assert.strictEqual(body.playlist.name, 'Morning Mix');
    assert.strictEqual(body.playlist.rotationInterval, 300);


  } finally {
    await closeServer(server);
  }
});

test('GET /api/playlists/:id returns specific playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Playlist' })
    });
    const { playlist } = await createRes.json();

    // Get playlist
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.playlist.id, playlist.id);


  } finally {
    await closeServer(server);
  }
});

test('GET /api/playlists/:id returns 404 for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    const response = await fetch(`http://localhost:${port}/api/playlists/non-existent-id`);

    assert.strictEqual(response.status, 404);


  } finally {
    await closeServer(server);
  }
});

test('PATCH /api/playlists/:id updates playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original' })
    });
    const { playlist } = await createRes.json();

    // Update playlist
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', shuffle: true })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.playlist.name, 'Updated');
    assert.strictEqual(body.playlist.shuffle, true);


  } finally {
    await closeServer(server);
  }
});

test('DELETE /api/playlists/:id removes playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const { playlist } = await createRes.json();

    // Delete playlist
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`, {
      method: 'DELETE'
    });

    assert.strictEqual(response.status, 204);

    // Verify it's gone
    const getRes = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`);
    assert.strictEqual(getRes.status, 404);


  } finally {
    await closeServer(server);
  }
});

test('POST /api/playlists/:id/presets adds preset to playlist', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const { playlist } = await createRes.json();

    // Add preset
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'preset-123', duration: 60 })
    });

    assert.strictEqual(response.status, 200);

    // Check playlist has preset
    const getRes = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`);
    const body = await getRes.json();
    assert.strictEqual(body.playlist.presets.length, 1);
    assert.strictEqual(body.playlist.presets[0].presetId, 'preset-123');


  } finally {
    await closeServer(server);
  }
});

test('DELETE /api/playlists/:id/presets/:presetId removes preset', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const { playlist } = await createRes.json();

    // Add preset
    await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'preset-123' })
    });

    // Remove preset
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets/preset-123`, {
      method: 'DELETE'
    });

    assert.strictEqual(response.status, 204);

    // Verify it's gone
    const getRes = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`);
    const body = await getRes.json();
    assert.strictEqual(body.playlist.presets.length, 0);


  } finally {
    await closeServer(server);
  }
});

test('PUT /api/playlists/:id/reorder reorders presets', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const { playlist } = await createRes.json();

    // Add presets
    await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'preset-1' })
    });
    await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'preset-2' })
    });
    await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'preset-3' })
    });

    // Reorder
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetIds: ['preset-3', 'preset-1', 'preset-2'] })
    });

    assert.strictEqual(response.status, 200);

    // Check order
    const getRes = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}`);
    const body = await getRes.json();
    assert.strictEqual(body.playlist.presets[0].presetId, 'preset-3');
    assert.strictEqual(body.playlist.presets[1].presetId, 'preset-1');
    assert.strictEqual(body.playlist.presets[2].presetId, 'preset-2');


  } finally {
    await closeServer(server);
  }
});

test('PUT /api/playlists/:id/reorder validates input', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlist
    const createRes = await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const { playlist } = await createRes.json();

    // Try to reorder with invalid input
    const response = await fetch(`http://localhost:${port}/api/playlists/${playlist.id}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetIds: 'not-an-array' })
    });

    assert.strictEqual(response.status, 400);


  } finally {
    await closeServer(server);
  }
});

test('GET /api/playlists supports search filter', async () => {
  await cleanupTestFiles();
  
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();


  try {
    // Create playlists
    await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Morning Mix', description: 'Energizing' })
    });
    await fetch(`http://localhost:${port}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Evening Calm', description: 'Relaxing' })
    });

    // Search
    const response = await fetch(`http://localhost:${port}/api/playlists?search=morning`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.playlists.length, 1);
    assert.ok(body.playlists[0].name.includes('Morning'));


  } finally {
    await closeServer(server);
  }
});

// Cleanup
test('cleanup test files', async () => {
  await cleanupTestFiles();
});
