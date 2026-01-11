# Entropic Aura - Implementation Plan

This document outlines the implementation plan for missing features in the Entropic Aura application.

## Overview

Entropic Aura is a live generated atmosphere application providing continuous audio streaming using ComfyUI as a backend. The application aims to deliver smooth, evolving soundscapes through multi-track mixing and intelligent preset management.

## Current Implementation Status

### ✅ Implemented Features
1. **Basic Audio Generation**
   - Text-to-audio via ComfyUI backend
   - Streaming audio playback (AAC 128kbps)
   - User prompt input interface

2. **Basic UI**
   - SoundscapeCreator view with text input
   - Mood tag selection (Relaxing, Energizing)
   - Audio player with controls

3. **Backend Infrastructure**
   - Node.js server (`backend/server.js`)
   - ComfyUI integration (`backend/comfyAudioClient.js`)
   - FFmpeg worker pool for transcoding

## Missing Features to Implement

### Phase 1: Multi-Track Audio System

#### 1.1 Four Simultaneous Track Generation
**Description**: Generate and maintain 4 independent audio tracks simultaneously, each with its own generation parameters.

**Technical Requirements**:
- Modify `backend/comfyAudioClient.js` to support multiple concurrent ComfyUI requests
- Implement track management system to maintain state of 4 active tracks
- Add track metadata (generation time, prompt, duration, etc.)

**Implementation Steps**:
1. Create `TrackManager` class to handle 4 track slots
2. Implement track lifecycle: generating → ready → playing → fading → expired
3. Add API endpoint `/api/tracks` to manage track pool
4. Implement pre-generation logic to keep tracks ready before current ones finish

**Files to Create/Modify**:
- `backend/trackManager.js` (new)
- `backend/comfyAudioClient.js` (modify)
- `backend/server.js` (add new endpoints)

#### 1.2 Real-Time Audio Mixing
**Description**: Mix 4 tracks together with individual volume controls and crossfading.

**Technical Requirements**:
- Implement audio mixing using FFmpeg or Web Audio API
- Support dynamic volume adjustment per track
- Handle sample rate and format conversion

**Implementation Steps**:
1. Create `AudioMixer` class using FFmpeg filter chains
2. Implement crossfade algorithm between tracks
3. Add volume envelope control for smooth transitions
4. Support real-time parameter adjustment

**Files to Create/Modify**:
- `backend/audioMixer.js` (new)
- `backend/audio-workflow.json` (modify for multi-track)

#### 1.3 Smooth Transitions
**Description**: Seamless crossfading between different atmospheres with configurable transition times.

**Technical Requirements**:
- Configurable crossfade duration (e.g., 5-30 seconds)
- Intelligent transition timing based on audio analysis
- Fade curves (linear, exponential, logarithmic)

**Implementation Steps**:
1. Implement crossfade scheduler
2. Add transition configuration options
3. Create fade curve algorithms
4. Add audio analysis for transition points (optional)

**Files to Create/Modify**:
- `backend/transitionEngine.js` (new)

### Phase 2: Preset Management System

#### 2.1 Preset Data Model
**Description**: Define and store atmosphere presets with all generation parameters.

**Data Structure**:
```javascript
{
  id: string,
  name: string,
  description: string,
  prompt: string,
  mood: string,
  tags: string[],
  parameters: {
    duration: number,
    temperature: number,
    // Other ComfyUI parameters
  },
  thumbnail: string (optional),
  createdAt: timestamp,
  updatedAt: timestamp,
  isFavorite: boolean,
  timesPlayed: number
}
```

**Implementation Steps**:
1. Create database schema (using Dexie - already in dependencies)
2. Implement CRUD operations for presets
3. Add validation and error handling
4. Create migration system for schema updates

**Files to Create/Modify**:
- `src/store/modules/presets/` (new directory)
- `src/store/modules/presets/presetsStore.js` (new)
- `src/services/presetService.js` (new)
- `src/db/schema.js` (new)

#### 2.2 Preset UI Components
**Description**: User interface for creating, editing, and managing presets.

**Components Needed**:
- PresetList.vue - Display all presets in grid/list view
- PresetCard.vue - Individual preset card with preview
- PresetEditor.vue - Create/edit preset form
- PresetSelector.vue - Quick preset selection dropdown

**Implementation Steps**:
1. Create preset list view with search/filter
2. Implement preset editor with form validation
3. Add preset preview/test functionality
4. Create import/export functionality

**Files to Create/Modify**:
- `src/components/presets/PresetList.vue` (new)
- `src/components/presets/PresetCard.vue` (new)
- `src/components/presets/PresetEditor.vue` (new)
- `src/components/presets/PresetSelector.vue` (new)
- `src/views/PresetManager.vue` (new)
- `src/router/index.js` (add routes)

#### 2.3 Built-in Preset Library
**Description**: Curated collection of pre-made atmosphere presets.

**Preset Categories**:
- Nature (Rain, Ocean, Forest, Wind)
- Urban (Café, City, Traffic, Market)
- Abstract (Drone, Texture, Ambient)
- Meditation (Calm, Focus, Sleep)
- Energetic (Workout, Motivation, Creative)

**Implementation Steps**:
1. Define preset JSON data file
2. Implement preset seeding on first launch
3. Add preset update mechanism
4. Create preset versioning system

**Files to Create/Modify**:
- `src/data/defaultPresets.json` (new)
- `src/db/seed.js` (new)

### Phase 3: Favorites System

#### 3.1 Favorites Data Layer
**Description**: Mark presets as favorites and manage favorites collection.

**Implementation Steps**:
1. Add `isFavorite` flag to preset schema
2. Create favorites service with toggle/list methods
3. Implement favorites sorting (most used, recent, etc.)
4. Add favorites persistence

**Files to Create/Modify**:
- `src/services/favoritesService.js` (new)
- `src/store/modules/favorites/favoritesStore.js` (new)

#### 3.2 Favorites UI
**Description**: Quick access to favorite presets.

**Features**:
- Favorites tab in preset list
- Quick favorites selector in main view
- Drag-and-drop to reorder favorites
- Favorites grid with large cards

**Implementation Steps**:
1. Add favorites filter to PresetList
2. Create FavoritesList component
3. Implement favorites quick selector
4. Add reordering functionality

**Files to Create/Modify**:
- `src/components/favorites/FavoritesList.vue` (new)
- `src/components/favorites/FavoritesQuickSelector.vue` (new)

### Phase 4: Playlist System

#### 4.1 Playlist Data Model
**Description**: Create playlists that rotate presets at configurable intervals.

**Data Structure**:
```javascript
{
  id: string,
  name: string,
  description: string,
  presets: [
    {
      presetId: string,
      duration: number, // Override default
      order: number
    }
  ],
  rotationInterval: number, // minutes
  shuffle: boolean,
  repeat: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Implementation Steps**:
1. Create playlist schema in database
2. Implement CRUD operations
3. Add playlist-preset relationship management
4. Create playlist playback engine

**Files to Create/Modify**:
- `src/store/modules/playlists/playlistsStore.js` (new)
- `src/services/playlistService.js` (new)
- `backend/playlistEngine.js` (new)

#### 4.2 Playlist Playback Engine
**Description**: Automatic rotation through playlist presets.

**Features**:
- Automatic preset switching at intervals
- Smooth transitions between presets
- Shuffle and repeat modes
- Playback state persistence
- Skip forward/backward functionality

**Implementation Steps**:
1. Create PlaylistPlayer class
2. Implement interval-based rotation
3. Add transition scheduling
4. Create playback controls

**Files to Create/Modify**:
- `src/services/playlistPlayer.js` (new)
- `backend/playlistController.js` (new)

#### 4.3 Playlist UI Components
**Description**: Create and manage playlists through UI.

**Components Needed**:
- PlaylistList.vue - All playlists view
- PlaylistCard.vue - Individual playlist card
- PlaylistEditor.vue - Create/edit playlists
- PlaylistPlayer.vue - Playlist playback controls
- PresetOrderer.vue - Drag-and-drop preset ordering

**Implementation Steps**:
1. Create playlist list and card views
2. Implement playlist editor with preset selector
3. Add drag-and-drop preset ordering
4. Create playlist player widget
5. Add playback visualization

**Files to Create/Modify**:
- `src/components/playlists/PlaylistList.vue` (new)
- `src/components/playlists/PlaylistCard.vue` (new)
- `src/components/playlists/PlaylistEditor.vue` (new)
- `src/components/playlists/PlaylistPlayer.vue` (new)
- `src/components/playlists/PresetOrderer.vue` (new)
- `src/views/PlaylistManager.vue` (new)

### Phase 5: Enhanced Audio Visualization

#### 5.1 Audio Visualizer Component
**Description**: Visual representation of playing audio.

**Features**:
- Waveform display
- Frequency spectrum analyzer
- Per-track visualization
- Transition animations

**Implementation Steps**:
1. Create AudioVisualizer component (currently missing)
2. Implement Web Audio API integration
3. Add visualization modes
4. Optimize rendering performance

**Files to Create/Modify**:
- `src/components/AudioVisualizer.vue` (new - referenced but missing)
- `src/services/audioAnalyzer.js` (new)

### Phase 6: User Settings & Preferences

#### 6.1 Settings System
**Description**: User preferences for audio quality, UI, and behavior.

**Settings Categories**:
- Audio Quality (bitrate, sample rate)
- Transition Settings (duration, curve type)
- UI Preferences (theme, layout)
- Playback Settings (auto-start, volume levels)

**Implementation Steps**:
1. Create settings store
2. Implement settings persistence
3. Add settings UI
4. Apply settings throughout app

**Files to Create/Modify**:
- `src/store/modules/settings/settingsStore.js` (new)
- `src/views/Settings.vue` (new)
- `src/services/settingsService.js` (new)

## Technical Architecture Recommendations

### Database Layer
- Use **Dexie.js** (already in dependencies) for local IndexedDB storage
- Store presets, playlists, favorites, settings locally
- Implement export/import for backup/sync

### State Management
- Use **Pinia** (already in dependencies) for state management
- Create separate stores for: presets, playlists, favorites, settings, playback
- Implement store persistence

### Backend API Endpoints

```
POST   /api/stream                 - Start streaming audio
GET    /api/tracks                 - Get active track status
POST   /api/tracks/generate        - Generate new track
DELETE /api/tracks/:id             - Remove track from pool
POST   /api/mix                    - Start mixing tracks
PUT    /api/mix/volumes            - Update track volumes
POST   /api/playlists/:id/play     - Start playlist playback
POST   /api/presets/test           - Test preset without saving
```

### Frontend Routes

```
/soundscape                - Main soundscape creator (existing)
/presets                   - Preset management
/presets/new               - Create new preset
/presets/:id/edit          - Edit preset
/favorites                 - Favorites view
/playlists                 - Playlist management
/playlists/new             - Create playlist
/playlists/:id/edit        - Edit playlist
/playlists/:id/play        - Playlist player view
/settings                  - User settings
```

## Development Priorities

### High Priority (Core Functionality)
1. Multi-track audio system (Phase 1)
2. Preset management (Phase 2.1, 2.2)
3. Basic playlist system (Phase 4.1, 4.2)

### Medium Priority (Enhanced UX)
4. Favorites system (Phase 3)
5. Built-in preset library (Phase 2.3)
6. Enhanced playlist UI (Phase 4.3)
7. Audio visualization (Phase 5)

### Low Priority (Polish)
8. User settings (Phase 6)
9. Advanced audio features
10. Social sharing features (future)

## Testing Strategy

### Unit Tests
- Test preset CRUD operations
- Test playlist logic
- Test audio mixing algorithms
- Test transition calculations

### Integration Tests
- Test ComfyUI integration
- Test FFmpeg pipeline
- Test database operations
- Test API endpoints

### E2E Tests
- Test complete user flows
- Test audio playback
- Test playlist rotation
- Test preset creation

## Performance Considerations

1. **Audio Generation**: Pre-generate tracks before needed
2. **Database**: Index frequently queried fields
3. **UI**: Virtualize large lists (presets, playlists)
4. **Memory**: Limit number of cached audio buffers
5. **Network**: Implement retry logic for ComfyUI failures

## Security Considerations

1. **Input Validation**: Sanitize all user inputs (prompts, names)
2. **Rate Limiting**: Limit audio generation requests per user
3. **Storage Limits**: Set maximum storage for presets/playlists
4. **XSS Prevention**: Sanitize HTML in descriptions

## Future Enhancements

1. **Cloud Sync**: Sync presets/playlists across devices
2. **Community Sharing**: Share presets with other users
3. **Advanced Audio**: Add effects (reverb, EQ, compression)
4. **Scheduled Playlists**: Time-based playlist activation
5. **Mobile App**: React Native companion app
6. **Voice Control**: Voice commands for playback control
7. **AI Suggestions**: ML-based preset recommendations
8. **Collaborative Playlists**: Multi-user playlist editing

## Conclusion

This implementation plan provides a roadmap for completing the Entropic Aura application. The phased approach allows for incremental development and testing, ensuring each feature is solid before moving to the next phase.

The core multi-track system (Phase 1) is foundational and should be implemented first. Once stable, the preset and playlist systems can be built on top, providing users with a complete, production-ready atmospheric audio application.
