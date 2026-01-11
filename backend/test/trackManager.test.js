const test = require('node:test');
const assert = require('node:assert');
const { TrackManager, TrackState } = require('../trackManager');

test('TrackManager creates tracks with default values', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test prompt' });
  
  assert.ok(track.id);
  assert.strictEqual(track.state, TrackState.GENERATING);
  assert.strictEqual(track.prompt, 'test prompt');
  assert.strictEqual(track.volume, 1.0);
  assert.strictEqual(track.duration, 45);
});

test('TrackManager respects max tracks limit', () => {
  const manager = new TrackManager(2);
  
  manager.createTrack({ prompt: 'track 1' });
  manager.createTrack({ prompt: 'track 2' });
  
  assert.ok(manager.canAddTrack() === false);
  
  const status = manager.getStatus();
  assert.strictEqual(status.activeTracks, 2);
  assert.strictEqual(status.maxTracks, 2);
  assert.strictEqual(status.canAddTrack, false);
});

test('TrackManager updates track state', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test' });
  
  const success = manager.updateTrackState(track.id, TrackState.READY);
  assert.ok(success);
  
  const updated = manager.getTrack(track.id);
  assert.strictEqual(updated.state, TrackState.READY);
});

test('TrackManager updates track volume', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test' });
  
  manager.updateTrackVolume(track.id, 0.5);
  
  const updated = manager.getTrack(track.id);
  assert.strictEqual(updated.volume, 0.5);
});

test('TrackManager clamps volume to valid range', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test' });
  
  manager.updateTrackVolume(track.id, 1.5);
  assert.strictEqual(manager.getTrack(track.id).volume, 1.0);
  
  manager.updateTrackVolume(track.id, -0.5);
  assert.strictEqual(manager.getTrack(track.id).volume, 0.0);
});

test('TrackManager removes tracks', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test' });
  
  const success = manager.removeTrack(track.id);
  assert.ok(success);
  
  const retrieved = manager.getTrack(track.id);
  assert.strictEqual(retrieved, null);
});

test('TrackManager gets all tracks', () => {
  const manager = new TrackManager();
  
  manager.createTrack({ prompt: 'track 1' });
  manager.createTrack({ prompt: 'track 2' });
  manager.createTrack({ prompt: 'track 3' });
  
  const tracks = manager.getAllTracks();
  assert.strictEqual(tracks.length, 3);
});

test('TrackManager filters tracks by state', () => {
  const manager = new TrackManager();
  
  const track1 = manager.createTrack({ prompt: 'track 1' });
  const track2 = manager.createTrack({ prompt: 'track 2' });
  
  manager.updateTrackState(track1.id, TrackState.READY);
  manager.updateTrackState(track2.id, TrackState.PLAYING);
  
  const readyTracks = manager.getAllTracks(TrackState.READY);
  assert.strictEqual(readyTracks.length, 1);
  assert.strictEqual(readyTracks[0].id, track1.id);
});

test('TrackManager gets active tracks', () => {
  const manager = new TrackManager();
  
  const track1 = manager.createTrack({ prompt: 'track 1' });
  const track2 = manager.createTrack({ prompt: 'track 2' });
  const track3 = manager.createTrack({ prompt: 'track 3' });
  
  manager.updateTrackState(track1.id, TrackState.READY);
  manager.updateTrackState(track2.id, TrackState.PLAYING);
  manager.updateTrackState(track3.id, TrackState.EXPIRED);
  
  const active = manager.getActiveTracks();
  assert.strictEqual(active.length, 2);
});

test('TrackManager provides accurate status', () => {
  const manager = new TrackManager(4);
  
  const track1 = manager.createTrack({ prompt: 'track 1' });
  const track2 = manager.createTrack({ prompt: 'track 2' });
  
  manager.updateTrackState(track1.id, TrackState.READY);
  manager.updateTrackState(track2.id, TrackState.PLAYING);
  
  const status = manager.getStatus();
  
  assert.strictEqual(status.totalTracks, 2);
  assert.strictEqual(status.activeTracks, 2);
  assert.strictEqual(status.maxTracks, 4);
  assert.strictEqual(status.canAddTrack, true);
  assert.strictEqual(status.tracksByState.ready, 1);
  assert.strictEqual(status.tracksByState.playing, 1);
  assert.strictEqual(status.tracksByState.generating, 0);
});

test('TrackManager sets startedAt when track starts playing', () => {
  const manager = new TrackManager();
  const track = manager.createTrack({ prompt: 'test' });
  
  assert.strictEqual(track.startedAt, null);
  
  manager.updateTrackState(track.id, TrackState.PLAYING);
  
  const updated = manager.getTrack(track.id);
  assert.ok(updated.startedAt);
  assert.ok(typeof updated.startedAt === 'number');
});

test('TrackManager stores track metadata', () => {
  const manager = new TrackManager();
  const metadata = { key: 'value', source: 'test' };
  
  const track = manager.createTrack({
    prompt: 'test',
    metadata
  });
  
  assert.deepStrictEqual(track.metadata, metadata);
});
