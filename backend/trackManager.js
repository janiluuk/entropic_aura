const { randomUUID } = require('crypto');
const { getMoodFilters } = require('./config/moods');

/**
 * Track states
 */
const TrackState = {
  GENERATING: 'generating',
  READY: 'ready',
  PLAYING: 'playing',
  FADING: 'fading',
  EXPIRED: 'expired'
};

/**
 * Manages a pool of audio tracks for multi-track playback
 */
class TrackManager {
  constructor(maxTracks = 4) {
    this.maxTracks = maxTracks;
    this.tracks = new Map();
  }

  /**
   * Create a new track
   * @param {Object} params - Track parameters
   * @returns {Object} Track object
   */
  createTrack(params = {}) {
    const track = {
      id: randomUUID(),
      state: TrackState.GENERATING,
      prompt: params.prompt || '',
      mood: params.mood || 'default',
      volume: params.volume !== undefined ? params.volume : 1.0,
      duration: params.duration || 45,
      createdAt: Date.now(),
      startedAt: null,
      filters: getMoodFilters(params.mood || 'default'),
      metadata: params.metadata || {}
    };

    this.tracks.set(track.id, track);
    this._cleanupExpiredTracks();
    
    return track;
  }

  /**
   * Update track state
   * @param {string} trackId - Track ID
   * @param {string} state - New state
   * @returns {boolean} Success
   */
  updateTrackState(trackId, state) {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.state = state;
    if (state === TrackState.PLAYING && !track.startedAt) {
      track.startedAt = Date.now();
    }
    
    return true;
  }

  /**
   * Update track volume
   * @param {string} trackId - Track ID
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @returns {boolean} Success
   */
  updateTrackVolume(trackId, volume) {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.volume = Math.max(0, Math.min(1, volume));
    return true;
  }

  /**
   * Get track by ID
   * @param {string} trackId - Track ID
   * @returns {Object|null} Track object or null
   */
  getTrack(trackId) {
    return this.tracks.get(trackId) || null;
  }

  /**
   * Get all tracks
   * @param {string} filterState - Optional state filter
   * @returns {Array} Array of track objects
   */
  getAllTracks(filterState = null) {
    const tracks = Array.from(this.tracks.values());
    
    if (filterState) {
      return tracks.filter(t => t.state === filterState);
    }
    
    return tracks;
  }

  /**
   * Get active tracks (not expired)
   * @returns {Array} Array of active tracks
   */
  getActiveTracks() {
    return Array.from(this.tracks.values()).filter(
      t => t.state !== TrackState.EXPIRED
    );
  }

  /**
   * Remove track
   * @param {string} trackId - Track ID
   * @returns {boolean} Success
   */
  removeTrack(trackId) {
    return this.tracks.delete(trackId);
  }

  /**
   * Check if we can add more tracks
   * @returns {boolean} Can add track
   */
  canAddTrack() {
    const activeCount = this.getActiveTracks().length;
    return activeCount < this.maxTracks;
  }

  /**
   * Get track pool status
   * @returns {Object} Status object
   */
  getStatus() {
    const tracks = Array.from(this.tracks.values());
    return {
      totalTracks: tracks.length,
      activeTracks: this.getActiveTracks().length,
      maxTracks: this.maxTracks,
      canAddTrack: this.canAddTrack(),
      tracksByState: {
        generating: tracks.filter(t => t.state === TrackState.GENERATING).length,
        ready: tracks.filter(t => t.state === TrackState.READY).length,
        playing: tracks.filter(t => t.state === TrackState.PLAYING).length,
        fading: tracks.filter(t => t.state === TrackState.FADING).length,
        expired: tracks.filter(t => t.state === TrackState.EXPIRED).length
      }
    };
  }

  /**
   * Clean up expired tracks older than threshold
   * @param {number} thresholdMs - Age threshold in milliseconds
   * @private
   */
  _cleanupExpiredTracks(thresholdMs = 300000) { // 5 minutes default
    const now = Date.now();
    for (const [id, track] of this.tracks.entries()) {
      if (track.state === TrackState.EXPIRED && 
          (now - track.createdAt) > thresholdMs) {
        this.tracks.delete(id);
      }
    }
  }
}

module.exports = {
  TrackManager,
  TrackState
};
