# K-Aura Stabilizer - Immediate Action Items

This document lists the most critical missing functionalities that should be implemented first.

## 🔴 Critical (Must Fix)

### 1. AudioVisualizer Component Missing
**Problem:** `SoundscapeCreator.vue` imports `AudioVisualizer` component that doesn't exist  
**Impact:** Application will crash when trying to use the soundscape creator  
**Location:** `src/components/AudioVisualizer.vue` (needs to be created)  
**Fix:**
```bash
# Create the component file
touch src/components/AudioVisualizer.vue
```

### 2. Speech Recording Not Implemented
**Problem:** "Speak" button toggles `recording` state but does nothing  
**Impact:** User expects voice input but nothing happens  
**Location:** `src/views/SoundscapeCreator.vue` lines 18-20  
**Fix:** Implement Web Audio API recording with speech-to-text

### 3. Missing Components Directory
**Problem:** `src/components/` directory doesn't exist  
**Impact:** Cannot create required components  
**Fix:**
```bash
mkdir -p src/components
```

## 🟡 High Priority (Should Implement Soon)

### 4. Error Handling in Backend
**Problem:** Basic error handling, no retry logic or timeout  
**Impact:** Poor user experience when ComfyUI is slow or unavailable  
**Location:** `backend/comfyAudioClient.js`  
**Improvements needed:**
- Add timeout to ComfyUI requests
- Implement retry logic
- Better error messages
- Health check endpoint

### 5. Mood Parameter Not Used
**Problem:** Frontend sends mood parameter but backend ignores it  
**Impact:** Different moods produce identical output  
**Location:** `backend/comfyAudioClient.js`  
**Fix:** Create mood-based FFmpeg filter presets

### 6. Test Coverage
**Problem:** Only one basic integration test exists  
**Impact:** No confidence in code changes  
**Location:** `backend/test/stream.test.js`  
**Needs:**
- Unit tests for individual functions
- More integration test scenarios
- Frontend component tests
- E2E tests

## 🟢 Medium Priority (Nice to Have)

### 7. Audio Download Feature
**Problem:** Users can only stream audio, can't save it  
**Impact:** Generated audio is lost when page closes  
**Location:** `src/views/SoundscapeCreator.vue`  
**Fix:** Add download button with filename generation

### 8. ComfyUI Health Check
**Problem:** No way to know if ComfyUI is available  
**Impact:** Users get errors without knowing why  
**Location:** `backend/server.js`  
**Fix:** Add `/api/health` endpoint that pings ComfyUI

### 9. Environment Variable Documentation
**Problem:** `.env.example` mentioned in README but doesn't exist  
**Impact:** Users don't know what can be configured  
**Fix:** Create `.env.example` file with all options

### 10. Audio Caching
**Problem:** Same prompt regenerates audio every time  
**Impact:** Wasted ComfyUI resources and slow response  
**Location:** `backend/server.js`  
**Fix:** Add simple file or Redis-based cache

## Quick Wins (Easy Fixes)

### 11. Create Missing Directory Structure
```bash
mkdir -p src/components
mkdir -p backend/utils
mkdir -p backend/config
```

### 12. Add Environment Example File
```bash
cat > .env.example << 'EOF'
# Backend Configuration
PORT=3000
COMFY_HOST=127.0.0.1:8188

# Frontend Configuration
VUE_APP_BASE_URL=http://localhost:8080
VUE_APP_API_URL=http://localhost:3000
EOF
```

### 13. Add Basic Validation
Add input validation to backend/server.js:
```javascript
if (!text || text.length > 500) {
  return res.status(400).json({ error: 'Invalid text parameter' });
}
```

## Implementation Order Recommendation

1. **First** - Fix AudioVisualizer component (create basic stub)
2. **Second** - Add proper error handling in backend
3. **Third** - Implement mood-based audio processing
4. **Fourth** - Add more tests
5. **Fifth** - Implement voice recording feature

## Testing Checklist Before Each Release

- [ ] `npm install --legacy-peer-deps` succeeds
- [ ] `npm run dev` starts frontend without errors
- [ ] `npm run api` starts backend without errors
- [ ] `npm test` passes all tests
- [ ] Can access frontend at http://localhost:8080
- [ ] Can generate audio with text prompt
- [ ] Different moods produce different results
- [ ] Error messages are user-friendly
- [ ] ComfyUI connection errors are handled gracefully

## Resources Needed

- **ComfyUI Instance:** Running on 127.0.0.1:8188 (or configured host)
- **FFmpeg:** Bundled via ffmpeg-static npm package
- **Node.js:** Version 20+
- **Browser:** Modern browser with Web Audio API support

## Notes

- The project description says "Image AI app" but it's actually an audio generation app
- Authentication system is referenced in router but not implemented
- Many UI components from PrimeVue are available but unused
- Docker setup exists but might need updates for new features

---

**Last Updated:** 2026-01-02  
**Priority Legend:**  
🔴 Critical - Breaks functionality  
🟡 High - Significantly impacts UX  
🟢 Medium - Nice to have improvements
