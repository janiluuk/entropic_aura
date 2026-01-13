# ComfyUI Setup Guide for Entropic Aura

This guide explains how to set up ComfyUI with Stable Audio for generating soundscapes in Entropic Aura.

## Prerequisites

- Python 3.10 or higher
- CUDA-capable GPU (recommended: 8GB+ VRAM)
- 20GB+ free disk space for models

## Installation Steps

### 1. Install ComfyUI

```bash
# Clone ComfyUI repository
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install ComfyUI Manager (Recommended)

ComfyUI Manager makes it easier to install custom nodes and models.

```bash
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
cd ..
```

### 3. Install Stable Audio Custom Node

```bash
cd custom_nodes
git clone https://github.com/a1lazydog/ComfyUI-AudioScheduler.git
# OR use ComfyUI Manager's GUI to search for and install "Stable Audio" nodes
cd ..
```

### 4. Download Stable Audio Model

**Option A: Using ComfyUI Manager (Easiest)**
1. Start ComfyUI: `python main.py`
2. Open browser to `http://localhost:8188`
3. Click "Manager" button
4. Go to "Model Manager"
5. Search for "Stable Audio Open"
6. Click "Install" on `stabilityai/stable-audio-open-1.0`

**Option B: Manual Download**
```bash
# Create models directory
mkdir -p models/stable-audio

# Download model files from HuggingFace
# Visit: https://huggingface.co/stabilityai/stable-audio-open-1.0
# Download these files to models/stable-audio/:
# - model.safetensors
# - config.json
# - model_config.json

# Or use git-lfs
cd models/stable-audio
git lfs install
git clone https://huggingface.co/stabilityai/stable-audio-open-1.0
cd ../..
```

## Model Information

### Stable Audio Open 1.0

- **Size**: ~2GB
- **HuggingFace**: `stabilityai/stable-audio-open-1.0`
- **Purpose**: Text-to-audio generation optimized for soundscapes
- **Output**: 47-second audio clips at 44.1kHz
- **License**: Stability AI Community License (commercial use allowed)

**Best for:**
- Environmental sounds (ocean, forest, rain)
- Ambient music and soundscapes
- Nature sounds
- Atmospheric audio

### Alternative Models (Optional)

**AudioCraft / MusicGen** (for music-focused generation)
- Model: `facebook/musicgen-medium`
- Size: ~1.5GB
- Better for: Musical compositions

**AudioLDM 2** (for sound effects)
- Model: `cvssp/audioldm2`
- Size: ~1.2GB  
- Better for: Specific sound effects, foley

## ComfyUI Workflow Configuration

Entropic Aura uses a simple workflow defined in `backend/audio-workflow.json`:

```json
{
  "1": {
    "class_type": "TextToAudio",
    "inputs": {
      "text": "",
      "duration": 45
    }
  },
  "2": {
    "class_type": "SaveAudio",
    "inputs": {
      "audio": ["1", 0],
      "filename_prefix": "soundscape"
    }
  }
}
```

### Node Types Required

1. **TextToAudio** - Converts text prompts to audio using Stable Audio
2. **SaveAudio** - Saves generated audio to disk

## Starting ComfyUI

```bash
cd ComfyUI
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py --listen 0.0.0.0 --port 8188
```

### Command-Line Options

- `--listen 0.0.0.0` - Listen on all network interfaces
- `--port 8188` - Port number (default: 8188)
- `--cpu` - Force CPU mode (if no GPU available)
- `--lowvram` - Use less VRAM (for GPUs with <8GB)

## Connecting Entropic Aura to ComfyUI

### 1. Environment Configuration

Create or edit `.env` file in the project root:

```env
COMFYUI_HOST=localhost:8188
```

### 2. Test Connection

```bash
# Start backend server
npm run api

# In another terminal, test health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "comfyui": true,
  "timestamp": "2024-01-13T20:00:00.000Z"
}
```

### 3. Generate Test Audio

```bash
# Test audio generation
curl -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "peaceful ocean waves with seagulls", "mood": "Relaxing"}' \
  --output test-audio.aac
```

## Prompt Engineering Tips

### Effective Prompts for Soundscapes

**Good prompts:**
- "Gentle rain falling on leaves in a peaceful forest"
- "Ocean waves crashing on a beach with distant seagulls"
- "Crackling fireplace with soft wind outside"
- "Thunderstorm with heavy rain and distant thunder"
- "Singing birds in a spring morning garden"

**Avoid:**
- Very short prompts ("rain") - be descriptive
- Contradictory terms ("loud quiet music")
- Too many unrelated elements in one prompt

### Mood-Based Prompt Enhancement

Entropic Aura automatically enhances prompts based on mood:

**Relaxing mood adds:**
- "peaceful", "calm", "gentle", "soothing"

**Energizing mood adds:**
- "upbeat", "dynamic", "lively", "vibrant"

## Troubleshooting

### ComfyUI won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Model not found error
```bash
# Verify model location
ls -la models/stable-audio/

# Re-download if needed
cd models/stable-audio
git lfs pull
```

### Out of memory errors
```bash
# Start with low VRAM mode
python main.py --lowvram

# Or force CPU mode (slower)
python main.py --cpu
```

### Connection refused
```bash
# Check if ComfyUI is running
curl http://localhost:8188

# Check firewall settings
sudo ufw allow 8188

# Verify backend configuration
cat .env | grep COMFYUI_HOST
```

### Slow generation
- Ensure you're using GPU mode
- Close other GPU-intensive applications
- Use `--lowvram` if GPU memory is limited
- Consider using a smaller model

## Performance Optimization

### GPU Settings
```bash
# For NVIDIA GPUs, enable TensorFloat-32
export NVIDIA_TF32_OVERRIDE=1

# Set CUDA visible devices (if multiple GPUs)
export CUDA_VISIBLE_DEVICES=0
```

### ComfyUI Settings

In ComfyUI settings (browser UI):
1. Enable "Auto Queue" for faster successive generations
2. Adjust "Max Queue Size" based on your needs
3. Enable "Dev Mode" for debugging

## Docker Deployment (Optional)

For production deployment, use Docker:

```dockerfile
# Example docker-compose.yml
version: '3.8'
services:
  comfyui:
    image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
    volumes:
      - ./ComfyUI:/workspace/ComfyUI
      - ./models:/workspace/ComfyUI/models
    ports:
      - "8188:8188"
    command: python main.py --listen 0.0.0.0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Additional Resources

- **ComfyUI Documentation**: https://github.com/comfyanonymous/ComfyUI
- **Stable Audio Paper**: https://arxiv.org/abs/2402.04825
- **HuggingFace Model Page**: https://huggingface.co/stabilityai/stable-audio-open-1.0
- **ComfyUI Workflows**: https://comfyworkflows.com/

## Support

If you encounter issues:
1. Check ComfyUI console for error messages
2. Verify model files are downloaded completely
3. Test with ComfyUI's built-in example workflows
4. Check Entropic Aura logs: `npm run api` output
5. Open an issue on GitHub with logs and configuration

## Next Steps

After setup:
1. Start ComfyUI: `python main.py`
2. Start Entropic Aura backend: `npm run api`
3. Start Entropic Aura frontend: `npm run dev`
4. Visit `http://localhost:8080` and create your first soundscape!
