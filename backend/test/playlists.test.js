const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const {
  initPlaylistStorage,
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addPresetToPlaylist,
  removePresetFromPlaylist,
  reorderPlaylistPresets
} = require('../utils/playlists');

const TEST_PLAYLISTS_FILE = path.join(__dirname, '../storage/playlists.json');

// Helper to clean up test files
async function cleanupTestFiles() {
  try {
    await fs.unlink(TEST_PLAYLISTS_FILE);
  } catch {}
}

test('initPlaylistStorage creates storage file', async () => {
  await cleanupTestFiles();
  await initPlaylistStorage();
  
  const playlistsExist = await fs.access(TEST_PLAYLISTS_FILE).then(() => true).catch(() => false);
  
  assert.ok(playlistsExist);
});

test('createPlaylist creates a new playlist', async () => {
  await cleanupTestFiles();
  
  const playlistData = {
    name: 'Morning Mix',
    description: 'Energizing morning sounds',
    presets: [],
    rotationInterval: 300,
    shuffle: false,
    repeat: true
  };
  
  const playlist = await createPlaylist(playlistData);
  
  assert.ok(playlist.id);
  assert.strictEqual(playlist.name, 'Morning Mix');
  assert.strictEqual(playlist.description, 'Energizing morning sounds');
  assert.ok(Array.isArray(playlist.presets));
  assert.strictEqual(playlist.rotationInterval, 300);
  assert.strictEqual(playlist.shuffle, false);
  assert.strictEqual(playlist.repeat, true);
  assert.ok(playlist.createdAt);
});

test('createPlaylist uses default values', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({});
  
  assert.strictEqual(playlist.name, 'Unnamed Playlist');
  assert.strictEqual(playlist.description, '');
  assert.ok(Array.isArray(playlist.presets));
  assert.strictEqual(playlist.rotationInterval, 300);
  assert.strictEqual(playlist.shuffle, false);
  assert.strictEqual(playlist.repeat, true);
});

test('getAllPlaylists returns all playlists', async () => {
  await cleanupTestFiles();
  
  await createPlaylist({ name: 'Playlist 1' });
  await createPlaylist({ name: 'Playlist 2' });
  
  const playlists = await getAllPlaylists();
  
  assert.strictEqual(playlists.length, 2);
});

test('getAllPlaylists filters by search', async () => {
  await cleanupTestFiles();
  
  await createPlaylist({ name: 'Morning Mix', description: 'Energizing sounds' });
  await createPlaylist({ name: 'Evening Calm', description: 'Relaxing vibes' });
  
  const morning = await getAllPlaylists({ search: 'morning' });
  
  assert.strictEqual(morning.length, 1);
  assert.ok(morning[0].name.includes('Morning'));
});

test('getAllPlaylists sorts by creation date', async () => {
  await cleanupTestFiles();
  
  const playlist1 = await createPlaylist({ name: 'First' });
  
  // Small delay to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const playlist2 = await createPlaylist({ name: 'Second' });
  
  const playlists = await getAllPlaylists();
  
  // Newest first
  assert.strictEqual(playlists[0].name, 'Second');
  assert.strictEqual(playlists[1].name, 'First');
});

test('getPlaylistById returns specific playlist', async () => {
  await cleanupTestFiles();
  
  const created = await createPlaylist({ name: 'Test Playlist' });
  const retrieved = await getPlaylistById(created.id);
  
  assert.ok(retrieved);
  assert.strictEqual(retrieved.id, created.id);
  assert.strictEqual(retrieved.name, 'Test Playlist');
});

test('getPlaylistById returns null for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const playlist = await getPlaylistById('non-existent-id');
  
  assert.strictEqual(playlist, null);
});

test('updatePlaylist updates playlist fields', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Original' });
  
  // Add a small delay to ensure updatedAt differs from createdAt
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const updated = await updatePlaylist(playlist.id, {
    name: 'Updated',
    description: 'New description',
    shuffle: true
  });
  
  assert.ok(updated);
  assert.strictEqual(updated.name, 'Updated');
  assert.strictEqual(updated.description, 'New description');
  assert.strictEqual(updated.shuffle, true);
  assert.strictEqual(updated.id, playlist.id);
  assert.notStrictEqual(updated.updatedAt, updated.createdAt);
});

test('updatePlaylist preserves id and createdAt', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  const updated = await updatePlaylist(playlist.id, {
    id: 'different-id',
    createdAt: '2000-01-01'
  });
  
  assert.strictEqual(updated.id, playlist.id);
  assert.strictEqual(updated.createdAt, playlist.createdAt);
});

test('deletePlaylist removes playlist', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  const success = await deletePlaylist(playlist.id);
  
  assert.ok(success);
  
  const retrieved = await getPlaylistById(playlist.id);
  assert.strictEqual(retrieved, null);
});

test('deletePlaylist returns false for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const success = await deletePlaylist('non-existent-id');
  
  assert.strictEqual(success, false);
});

test('addPresetToPlaylist adds preset to playlist', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  const success = await addPresetToPlaylist(playlist.id, 'preset-123', { duration: 60 });
  
  assert.ok(success);
  
  const updated = await getPlaylistById(playlist.id);
  assert.strictEqual(updated.presets.length, 1);
  assert.strictEqual(updated.presets[0].presetId, 'preset-123');
  assert.strictEqual(updated.presets[0].duration, 60);
  assert.strictEqual(updated.presets[0].order, 0);
});

test('addPresetToPlaylist uses default order', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-1');
  await addPresetToPlaylist(playlist.id, 'preset-2');
  
  const updated = await getPlaylistById(playlist.id);
  assert.strictEqual(updated.presets.length, 2);
  assert.strictEqual(updated.presets[0].order, 0);
  assert.strictEqual(updated.presets[1].order, 1);
});

test('addPresetToPlaylist prevents duplicates', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-123');
  const success = await addPresetToPlaylist(playlist.id, 'preset-123');
  
  assert.strictEqual(success, false);
  
  const updated = await getPlaylistById(playlist.id);
  assert.strictEqual(updated.presets.length, 1);
});

test('addPresetToPlaylist returns false for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const success = await addPresetToPlaylist('non-existent-id', 'preset-123');
  
  assert.strictEqual(success, false);
});

test('removePresetFromPlaylist removes preset', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-123');
  await addPresetToPlaylist(playlist.id, 'preset-456');
  
  const success = await removePresetFromPlaylist(playlist.id, 'preset-123');
  
  assert.ok(success);
  
  const updated = await getPlaylistById(playlist.id);
  assert.strictEqual(updated.presets.length, 1);
  assert.strictEqual(updated.presets[0].presetId, 'preset-456');
});

test('removePresetFromPlaylist returns false for non-existent preset', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  const success = await removePresetFromPlaylist(playlist.id, 'non-existent-preset');
  
  assert.strictEqual(success, false);
});

test('removePresetFromPlaylist returns false for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const success = await removePresetFromPlaylist('non-existent-id', 'preset-123');
  
  assert.strictEqual(success, false);
});

test('reorderPlaylistPresets reorders presets', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-1');
  await addPresetToPlaylist(playlist.id, 'preset-2');
  await addPresetToPlaylist(playlist.id, 'preset-3');
  
  const success = await reorderPlaylistPresets(playlist.id, ['preset-3', 'preset-1', 'preset-2']);
  
  assert.ok(success);
  
  const updated = await getPlaylistById(playlist.id);
  assert.strictEqual(updated.presets[0].presetId, 'preset-3');
  assert.strictEqual(updated.presets[0].order, 0);
  assert.strictEqual(updated.presets[1].presetId, 'preset-1');
  assert.strictEqual(updated.presets[1].order, 1);
  assert.strictEqual(updated.presets[2].presetId, 'preset-2');
  assert.strictEqual(updated.presets[2].order, 2);
});

test('reorderPlaylistPresets returns false for invalid preset IDs', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-1');
  await addPresetToPlaylist(playlist.id, 'preset-2');
  
  const success = await reorderPlaylistPresets(playlist.id, ['preset-1', 'preset-999']);
  
  assert.strictEqual(success, false);
});

test('reorderPlaylistPresets returns false for incomplete preset list', async () => {
  await cleanupTestFiles();
  
  const playlist = await createPlaylist({ name: 'Test' });
  
  await addPresetToPlaylist(playlist.id, 'preset-1');
  await addPresetToPlaylist(playlist.id, 'preset-2');
  await addPresetToPlaylist(playlist.id, 'preset-3');
  
  // Only providing 2 of 3 presets
  const success = await reorderPlaylistPresets(playlist.id, ['preset-1', 'preset-2']);
  
  assert.strictEqual(success, false);
});

test('reorderPlaylistPresets returns false for non-existent playlist', async () => {
  await cleanupTestFiles();
  
  const success = await reorderPlaylistPresets('non-existent-id', ['preset-1']);
  
  assert.strictEqual(success, false);
});

// Cleanup after all tests
test('cleanup test files', async () => {
  await cleanupTestFiles();
});
