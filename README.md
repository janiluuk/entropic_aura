# Entropic Aura

**Entropic Aura** is a live generated atmosphere application that streams continuous audio to users. It uses ComfyUI as a backend to generate ambient soundscapes from presets or user prompts.

## Screenshots

### Soundscape Creator
The main page for creating custom atmospheric soundscapes. This is where the magic happens!

![Soundscape Creator - Initial View](https://github.com/user-attachments/assets/6c50a240-6135-426b-b41e-ea7e869afbce)

**Features:**
- **Text Prompt Input**: Describe your desired soundscape in natural language (e.g., "peaceful forest with birdsong" or "rain on a tin roof")
- **Voice Input**: Use the microphone button to describe your soundscape with your voice
- **Mood Presets**: Quick selection buttons for common moods (Relaxing, Energizing, Peaceful, Dark, Cinematic, Nature)
- **Audio Player**: Built-in player with play/pause, volume control, and progress tracking
- **4-Channel Audio Mixer**: Advanced mixing controls (expandable under "Advanced Settings")
  - Individual volume sliders for each of 4 audio channels
  - Real-time visualizers showing frequency data for each channel
  - Mute/unmute controls for each channel
  - Master controls to reset all or mute/unmute all channels
- **Save as Preset**: Quickly save your current soundscape configuration for later use

![Soundscape Creator - With All Mood Buttons](https://github.com/user-attachments/assets/c928123a-f96f-41fc-8a88-339c57f99394)



### Preset Manager
Browse, search, and manage your saved atmosphere presets. This is your personal library of soundscapes.

![Preset Manager](https://github.com/user-attachments/assets/39316299-0035-4e2e-a91b-0d537c4cd23c)

**Features:**
- **Search Bar**: Quick search across preset names, descriptions, and prompts
- **Filter by Mood**: Filter presets by mood tags (Relaxing, Energizing, Nature, etc.)
- **Filter by Tags**: Custom tags to organize your presets
- **Sort Options**: Sort by creation date or popularity (play count)
- **Favorites**: Star your favorite presets for quick access with a dedicated favorites filter
- **Preset Cards**: Each card displays:
  - Preset name and description
  - Mood and custom tags
  - Play count and last played date
  - Quick actions: Play, Edit, Delete, Favorite/Unfavorite
- **Create New**: Button to create a new preset from scratch
- **Grid Layout**: Responsive grid that adapts to your screen size

### Playlist Manager
Create and manage playlists that automatically rotate between different atmospheres.

![Playlist Manager](screenshots/03-playlists-manager.png)

**Features:**
- **Search Playlists**: Find playlists by name or description
- **Create New Playlist**: Build custom playlists with rotation intervals
- **Playlist Cards**: Each card shows:
  - Playlist name and description
  - Number of presets included
  - Rotation settings (interval, shuffle, repeat)
  - Quick actions: Play, Edit, Delete
- **Playlist Editor**: When creating or editing a playlist:
  - Add presets from your preset library
  - Set individual duration for each preset
  - Reorder presets with drag-and-drop
  - Configure global rotation interval (seconds between preset switches)
  - Toggle shuffle mode (randomize preset order)
  - Toggle repeat mode (loop the playlist)
- **Automation**: Playlists automatically switch between presets based on your settings
- **Visual Indicators**: See which preset is currently playing in an active playlist

### Settings
Customize your Entropic Aura experience with comprehensive settings.

![Settings](screenshots/04-settings.png)

**Settings Categories:**
- **Audio Quality**:
  - Bitrate selection (128, 192, 256 kbps)
  - Sample rate (44.1, 48 kHz)
  - Channel configuration (Stereo, 4-Channel)
- **Playback Preferences**:
  - Auto-play next in playlists
  - Crossfade duration
  - Default volume level
  - Pre-load next track option
- **Visualizations**:
  - Enable/disable audio visualizers
  - Visualization style selection
  - Color scheme preferences
- **Data Management**:
  - Export all presets and playlists (JSON format)
  - Import previously exported data
  - Clear all data (with confirmation)
  - View storage usage statistics
- **Appearance**:
  - Theme selection (Light, Dark, Auto)
  - Navigation style preferences
  - Compact mode toggle
- **Advanced**:
  - ComfyUI server connection settings
  - Debug mode toggle
  - Performance monitoring

## Features

### Currently Implemented
- **Live Audio Generation**: Generate atmospheric audio using ComfyUI backend with 4-channel output
- **4-Channel Audio Mixer**: Fine-tune soundscapes with independent volume control for each of the 4 audio channels
- **Advanced Mixer Controls**: Expandable mixer section with per-channel visualizers and mute controls (hidden by default)
- **Text Prompts**: Create soundscapes from text descriptions
- **Mood Presets**: Quick selection of mood-based atmospheres (Relaxing, Energizing, Peaceful, Dark, Cinematic, Nature)
- **Continuous Streaming**: Smooth audio playback via AAC streaming at 128 kbps
- **Multi-Track System**: 4 simultaneous audio tracks with independent generation and volume control
- **Preset Management**: Create, save, edit, and manage custom atmosphere presets
- **Favorites System**: Mark and quickly access favorite presets
- **Playback History**: Track and review recently generated soundscapes
- **Playlist System**: Create playlists that rotate atmospheres at configurable intervals
- **Playlist Automation**: Automatic preset switching with shuffle and repeat modes
- **User Settings**: Customize audio quality, playback preferences, and appearance
- **Data Export/Import**: Backup and restore presets, playlists, and settings
- **Real-Time Audio Mixing**: Advanced mixing with dynamic crossfading between tracks
- **Crossfade Transitions**: Seamless blending between different atmospheres

### Planned Features
- **Advanced Audio Effects**: Real-time filter adjustment and custom effect chains

## Architecture

The application consists of:
- **Frontend**: Vue 3 application with PrimeVue UI components
- **Backend**: Node.js server (`backend/server.js`) that interfaces with ComfyUI
- **ComfyUI Integration**: Text-to-audio generation via custom workflow
- **FFmpeg Workers**: Scalable worker pool for audio transcoding (6 instances recommended)

## Requirements

### Frontend app

Front‑end Vue app with a Node.js helper that streams audio generated by a
local [ComfyUI](https://github.com/comfyanonymous/ComfyUI) instance through
an FFmpeg filter chain.

## Prerequisites

- Node.js 20+
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) copy `.env.example` to `.env` and adjust `VUE_APP_BASE_URL` or
   other settings as needed.

## Development

Start the frontend and backend servers:

```bash
# Frontend dev server (http://localhost:8080)
npm run dev

# Backend API server (http://localhost:3000) - in another terminal
npm run api
```

Visit [http://localhost:8080/soundscape](http://localhost:8080/soundscape) to create soundscapes.

### Docker Support

For Docker deployment with FFmpeg workers:

```bash
docker compose up --build
```

### ComfyUI Configuration

The backend connects to a ComfyUI server at `127.0.0.1:8188` by default. To use a different host:

```bash
COMFY_HOST=192.168.1.50:8188 npm run api
```


## 4-Channel Audio Mixer

All generated soundscapes are created with **4 audio channels**, allowing for fine-tuned control over the audio output. The mixer provides:

### Features
- **Individual Channel Control**: Adjust volume for each of the 4 channels independently
- **Real-Time Visualization**: Each channel has its own sound level indicator showing frequency data
- **Mute Controls**: Quickly mute/unmute individual channels
- **Master Controls**: Reset all channels to default or mute/unmute all at once
- **Collapsible Interface**: The mixer is hidden by default under "Advanced Settings" to keep the UI clean

### Usage
1. Generate a soundscape using the Soundscape Creator
2. Once audio starts playing, locate the "Advanced Settings" section below the audio player
3. Click on "▶ Advanced Settings" to expand the mixer controls
4. Use the volume sliders to adjust individual channels (0-100%)
5. Monitor each channel's activity through the colored visualizers:
   - Channel 1: Red
   - Channel 2: Green
   - Channel 3: Blue
   - Channel 4: Yellow

### Technical Details
- Audio is generated with 4 channels in the backend using FFmpeg
- Frontend uses Web Audio API for channel splitting and analysis
- Each channel can be independently controlled without affecting others
- AAC encoding at 128 kbps maintains quality across all channels

## Testing

Integration tests for the backend live in `backend/test/`. Run them with:

```bash
npm test
```

For frontend tests:

```bash
npm run test:frontend
```

For end-to-end tests:

```bash
npm run test:e2e
```

## Roadmap

### Phase 1: Core Audio Features (Completed)
- ✅ Basic audio generation from prompts
- ✅ ComfyUI integration
- ✅ Streaming audio playback
- ✅ Mood-based audio filtering
- ✅ Playback history tracking

### Phase 2: Multi-Track System (Completed)
- ✅ Implement 4 simultaneous track generation
- ✅ Track state management (generating, ready, playing, fading, expired)
- ✅ Individual track volume control
- ✅ 4-channel audio generation and mixing
- ✅ Per-channel volume control with visualizers
- ✅ Real-time audio mixing engine with crossfading
- ✅ Crossfade transitions between tracks

### Phase 3: User Experience (Completed)
- ✅ Preset creation and management system
- ✅ Favorites functionality
- ✅ Search and filter presets
- ✅ Play count tracking
- ✅ Playlist builder with rotation intervals
- ✅ Enhanced audio visualization

### Phase 4: Advanced Features (In Progress)
- ✅ Playlist automation and scheduling
- ✅ Audio visualization components
- ✅ User settings and preferences
- ✅ Export/import presets and playlists
- ✅ 4-channel audio mixer with advanced controls
- ✅ Real-time audio mixing with crossfading
- ⏳ Advanced audio effects and filter chains
