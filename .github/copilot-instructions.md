# Copilot Instructions for Entropic Aura

## Project Overview

This is an audio-visual AI application (k-aura-stabilizer / entropic_aura) that combines Vue.js frontend with Node.js backend to create soundscapes and process audio through AI workflows. The application integrates with ComfyUI for audio generation and uses FFmpeg for audio processing and streaming.

## Technology Stack

### Frontend
- **Framework**: Vue 3.3.4 with Composition API (`<script setup>`)
- **Build Tool**: Vite 4.4.7
- **UI Library**: PrimeVue 3.28.0
- **Router**: Vue Router 4.0.14
- **State Management**: Vuex 4.0.2 and Pinia 2.0.21
- **Styling**: SASS, PrimeFlex for utilities
- **Additional Libraries**:
  - axios for HTTP requests
  - video.js and vue3-video-player for video playback
  - chart.js for data visualization
  - fabric for canvas manipulation
  - three.js for 3D graphics

### Backend
- **Runtime**: Node.js with Express.js
- **Audio Processing**: FFmpeg (fluent-ffmpeg, ffmpeg-static)
- **AI Integration**: ComfyUI client via WebSocket and HTTP
- **Streaming**: AAC audio at 128 kbps

## Development Setup

### Prerequisites
- Node.js version 17.0 or above
- npm
- Docker (optional, for containerized development)

### Environment Setup
1. Install dependencies: `npm install`
2. Create environment file: `cp .env.example .env`
3. Configure environment variables:
   - `VUE_APP_BASE_URL`: Frontend URL (e.g., http://localhost:8080/)
   - `VUE_APP_API_BASE_URL`: Backend API URL (e.g., http://localhost:3000/api/v1)

### Running the Application
- **Development (Frontend)**: `npm run dev` (starts Vite dev server on port 8080)
- **Development (Backend API)**: `npm run api` (starts Express server on port 3000)
- **Production Build**: `npm run build`
- **Lint**: `npm run lint`
- **Docker**: `docker compose up --build --scale ffmpeg-worker=6`

## Code Structure and Conventions

### Directory Structure
```
/
├── backend/              # Node.js backend server
│   ├── server.js        # Express server entry point
│   ├── comfyAudioClient.js  # ComfyUI integration
│   └── audio-workflow.json  # ComfyUI workflow definition
├── src/                 # Vue.js frontend source
│   ├── assets/         # Static assets (css, fonts, img, js, scss)
│   ├── components/     # Reusable Vue components
│   ├── layouts/        # Layout components
│   ├── router/         # Vue Router configuration
│   │   ├── index.js   # Main router setup
│   │   └── routes.js  # Additional route definitions
│   ├── services/       # API service layer (use these for API calls)
│   ├── store/          # Vuex store modules
│   ├── views/          # Page-level components
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

### Vue Component Guidelines
- **Use Composition API**: Prefer `<script setup>` syntax for new components
- **Component Naming**: Use PascalCase for component names (e.g., `SoundscapeCreator.vue`)
- **View Naming**: Follow pattern `Category/ActionName.vue` (e.g., `Profile/EditProfile.vue`)
- **Imports**: Use `@/` alias for absolute imports from `src/` directory

### API Services
- **Always use services layer** for API calls instead of direct axios calls in components
- Services are located in `src/services/`
- Authentication handled by `AuthService` in `src/services/auth/AuthService`

### Routing
- Routes are defined in `src/router/index.js`
- Protected routes use `meta: { requiresAuth: true }`
- JWT token authentication with expiration checking
- Auth routes use `meta: { handleAuth: true }`

### Styling
- **SCSS**: Primary styling approach
- **PrimeFlex**: Use for utility classes
- **Scoped Styles**: Use `<style scoped>` in components
- **Icons**: PrimeIcons available via `primeicons` package

## Backend Architecture

### Audio Streaming Flow
1. Client requests audio via `/api/stream?text=<description>&mood=<mood>`
2. Backend constructs ComfyUI workflow from `audio-workflow.json`
3. Workflow submitted to ComfyUI server via WebSocket
4. Generated audio fetched and piped through FFmpeg
5. FFmpeg transcodes to AAC @ 128kbps
6. Stream sent to client with `Content-Type: audio/aac`

### FFmpeg Worker Pool
- Docker Compose defines `ffmpeg-worker` service
- Scale to 6 instances for concurrent streams: `docker compose up --build --scale ffmpeg-worker=6`
- Each worker provides isolated FFmpeg binary

## Key Features

### Soundscape Creator
- Located at `/soundscape` route
- Component: `src/views/SoundscapeCreator.vue`
- Features:
  - Text prompt input for describing soundscapes
  - Mood selection (Relaxing, Energizing)
  - Voice recording capability
  - Real-time audio generation via ComfyUI
  - Audio visualization component
  - Streaming audio playback

### Authentication System
- JWT-based authentication
- Token stored and validated in router guards
- Automatic redirect to login for protected routes
- Token expiration handling

## Testing and Quality

### Linting
- ESLint configured with Vue and Prettier plugins
- Run with: `npm run lint`

### Building
- Production build: `npm run build`
- Vite optimized build process
- Output directory: `dist/`

## Important Notes

### CORS Configuration
- Vite dev server configured with CORS origin "*"
- Backend should handle CORS appropriately for production

### Environment Variables
- Loaded via `dotenv` in vite.config.js
- Access in components via `process.env.VUE_APP_*`

### Docker Development
- Full stack can run in Docker
- ComfyUI server should be accessible to backend
- FFmpeg workers scale horizontally

## Common Tasks

### Adding a New Route
1. Create Vue component in `src/views/`
2. Add route definition in `src/router/index.js`
3. Add `meta: { requiresAuth: true }` if authentication required

### Creating a New Component
1. Create `.vue` file in `src/components/` or `src/views/`
2. Use `<script setup>` for Composition API
3. Import and register in parent component
4. Use PrimeVue components for consistent UI

### Adding API Integration
1. Create service file in `src/services/`
2. Use axios for HTTP requests
3. Import and use service in components
4. Handle authentication tokens via AuthService

### Modifying Audio Workflow
1. Edit `backend/audio-workflow.json` to match ComfyUI workflow
2. Ensure node IDs and parameters match ComfyUI setup
3. Text input typically in node '1' inputs

## Dependencies Management

### Adding Dependencies
- Install with: `npm install <package>`
- Production: Add to `dependencies`
- Development: Add to `devDependencies` with `--save-dev`

### Key Dependencies to Note
- **sanitize-html**: Use for sanitizing user input to prevent XSS
- **axios**: Configured with interceptors in services
- **ws**: WebSocket client for ComfyUI communication

## Security Considerations

- Always sanitize user input, especially in audio/video processing workflows
- JWT tokens validated and checked for expiration
- Use `sanitize-html` for any user-generated content
- Validate file uploads and restrict file types
- Be cautious with ComfyUI workflow parameters to prevent injection

## Additional Resources

- **PrimeVue Docs**: https://primevue.org/
- **Vue 3 Docs**: https://vuejs.org/
- **Vite Docs**: https://vitejs.dev/
- **ComfyUI**: https://github.com/comfyanonymous/ComfyUI
